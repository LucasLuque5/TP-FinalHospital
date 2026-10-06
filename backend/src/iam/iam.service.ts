import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import type { ActualizarUsuarioDto, CrearUsuarioDto, LoginDto } from './dto/iam.dto.js';
import { Rol } from './entities/rol.entity.js';
import { Usuario } from './entities/usuario.entity.js';
import { NombreRol, type UsuarioActual } from './usuario-actual.js';

@Injectable()
export class IamService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(Rol) private readonly roles: Repository<Rol>,
    private readonly jwt: JwtService,
  ) {}

  /** Verifica usuario y contraseña. Si son correctos, entrega un token JWT. */
  async login(dto: LoginDto): Promise<{ token: string; usuario: UsuarioActual }> {
    const usuario = await this.usuarios
      .createQueryBuilder('u')
      .addSelect('u.passwordHash') // la columna está oculta por defecto
      .leftJoinAndSelect('u.rol', 'rol')
      .where('u.nombreUsuario = :nombre', { nombre: dto.nombreUsuario })
      .getOne();

    // Mismo mensaje para "no existe" y "contraseña incorrecta":
    // así no se le da pistas a quien intenta adivinar usuarios.
    const credencialesValidas =
      usuario !== null && (await bcrypt.compare(dto.password, usuario.passwordHash));
    if (!usuario || !credencialesValidas) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }
    if (!usuario.activo) {
      throw new UnauthorizedException('El usuario está desactivado.');
    }

    const datos: UsuarioActual = {
      id: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      nombreCompleto: `${usuario.nombre} ${usuario.apellido}`,
      rol: usuario.rol.nombre as NombreRol,
      pacienteId: usuario.pacienteId,
    };
    return { token: await this.jwt.signAsync({ ...datos }), usuario: datos };
  }

  listarRoles(): Promise<Rol[]> {
    return this.roles.find({ order: { id: 'ASC' } });
  }

  listarUsuarios(): Promise<Usuario[]> {
    return this.usuarios.find({ order: { apellido: 'ASC', nombre: 'ASC' } });
  }

  /** Lo usan las pantallas de turnos para elegir de qué médico es la agenda. */
  listarMedicos(): Promise<Usuario[]> {
    return this.usuarios.find({
      where: { rol: { nombre: NombreRol.Medico }, activo: true },
      order: { apellido: 'ASC' },
    });
  }

  /** Lo usan otros módulos para validar que un ID corresponde a un médico activo. */
  async obtenerMedico(id: number): Promise<Usuario> {
    const medico = await this.usuarios.findOneBy({ id, activo: true });
    if (!medico || medico.rol.nombre !== NombreRol.Medico) {
      throw new NotFoundException(`No existe un médico activo con ID ${id}.`);
    }
    return medico;
  }

  async crearUsuario(dto: CrearUsuarioDto): Promise<Usuario> {
    const rol = await this.buscarRol(dto.rolId);
    if (rol.nombre === NombreRol.Paciente && !dto.pacienteId) {
      throw new BadRequestException('Un usuario con rol Paciente debe estar vinculado a un paciente.');
    }
    if (await this.usuarios.existsBy({ nombreUsuario: dto.nombreUsuario })) {
      throw new ConflictException(`Ya existe el usuario "${dto.nombreUsuario}".`);
    }

    const guardado = await this.usuarios.save(
      this.usuarios.create({
        nombreUsuario: dto.nombreUsuario,
        // Nunca se guarda la contraseña: se guarda un hash que no se puede revertir.
        passwordHash: await bcrypt.hash(dto.password, 10),
        nombre: dto.nombre,
        apellido: dto.apellido,
        rol,
        pacienteId: rol.nombre === NombreRol.Paciente ? dto.pacienteId! : null,
        activo: true,
      }),
    );
    return this.buscarUsuario(guardado.id);
  }

  /** Gestión de roles: cambiar el rol de un usuario o activarlo/desactivarlo. */
  async actualizarUsuario(id: number, dto: ActualizarUsuarioDto): Promise<Usuario> {
    const usuario = await this.buscarUsuario(id);
    if (dto.rolId !== undefined) usuario.rol = await this.buscarRol(dto.rolId);
    if (dto.activo !== undefined) usuario.activo = dto.activo;
    await this.usuarios.save(usuario);
    return this.buscarUsuario(id);
  }

  private async buscarUsuario(id: number): Promise<Usuario> {
    const usuario = await this.usuarios.findOneBy({ id });
    if (!usuario) throw new NotFoundException(`No existe el usuario ${id}.`);
    return usuario;
  }

  private async buscarRol(id: number): Promise<Rol> {
    const rol = await this.roles.findOneBy({ id });
    if (!rol) throw new NotFoundException(`No existe el rol ${id}.`);
    return rol;
  }
}
