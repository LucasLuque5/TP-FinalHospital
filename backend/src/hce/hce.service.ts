import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { UsuarioActual } from '../iam/usuario-actual.js';
import type {
  ActualizarPacienteDto,
  CrearAlergiaDto,
  CrearAntecedenteDto,
  CrearEvolucionDto,
  CrearPacienteDto,
} from './dto/hce.dto.js';
import {
  Alergia,
  AntecedenteFamiliar,
  Estudio,
  EvolucionMedica,
} from './entities/historia.entities.js';
import { Paciente } from './entities/paciente.entity.js';

@Injectable()
export class HceService {
  constructor(
    @InjectRepository(Paciente) private readonly pacientes: Repository<Paciente>,
    @InjectRepository(Alergia) private readonly alergias: Repository<Alergia>,
    @InjectRepository(AntecedenteFamiliar)
    private readonly antecedentes: Repository<AntecedenteFamiliar>,
    @InjectRepository(EvolucionMedica) private readonly evoluciones: Repository<EvolucionMedica>,
    @InjectRepository(Estudio) private readonly estudios: Repository<Estudio>,
  ) {}

  // ---------- Ficha demográfica ----------

  listarPacientes(buscar?: string): Promise<Paciente[]> {
    const consulta = this.pacientes.createQueryBuilder('p').orderBy('p.apellido').addOrderBy('p.nombre');
    if (buscar?.trim()) {
      consulta.where('p.dni LIKE :texto OR p.nombre LIKE :texto OR p.apellido LIKE :texto', {
        texto: `%${buscar.trim()}%`,
      });
    }
    return consulta.getMany();
  }

  /** La usan los demás módulos para validar que un paciente existe. */
  async obtenerPaciente(id: number): Promise<Paciente> {
    const paciente = await this.pacientes.findOneBy({ id });
    if (!paciente) throw new NotFoundException(`No existe el paciente con ID ${id}.`);
    return paciente;
  }

  async registrarPaciente(dto: CrearPacienteDto): Promise<Paciente> {
    if (await this.pacientes.existsBy({ dni: dto.dni })) {
      throw new ConflictException(`Ya existe un paciente registrado con el DNI ${dto.dni}.`);
    }
    return this.pacientes.save(this.pacientes.create(dto));
  }

  async actualizarPaciente(id: number, dto: ActualizarPacienteDto): Promise<Paciente> {
    const paciente = await this.obtenerPaciente(id);
    return this.pacientes.save(Object.assign(paciente, dto));
  }

  // ---------- Historia clínica ----------

  async obtenerHistoria(pacienteId: number) {
    const paciente = await this.obtenerPaciente(pacienteId);
    const [alergias, antecedentes, evoluciones, estudios] = await Promise.all([
      this.alergias.find({ where: { pacienteId }, order: { id: 'DESC' } }),
      this.antecedentes.find({ where: { pacienteId }, order: { id: 'DESC' } }),
      this.evoluciones.find({ where: { pacienteId }, relations: { medico: true }, order: { id: 'DESC' } }),
      this.estudios.find({ where: { pacienteId }, order: { fecha: 'DESC', id: 'DESC' } }),
    ]);
    return { paciente, alergias, antecedentes, evoluciones, estudios };
  }

  async registrarAlergia(pacienteId: number, dto: CrearAlergiaDto): Promise<Alergia> {
    await this.obtenerPaciente(pacienteId);
    return this.alergias.save(this.alergias.create({ ...dto, pacienteId }));
  }

  async registrarAntecedente(pacienteId: number, dto: CrearAntecedenteDto) {
    await this.obtenerPaciente(pacienteId);
    return this.antecedentes.save(this.antecedentes.create({ ...dto, pacienteId }));
  }

  /**
   * Las evoluciones solo se AGREGAN. No existe ningún método para editarlas
   * o borrarlas: así se cumple que la historia clínica es inmutable.
   */
  async registrarEvolucion(pacienteId: number, dto: CrearEvolucionDto, medico: UsuarioActual) {
    await this.obtenerPaciente(pacienteId);
    return this.evoluciones.save(
      this.evoluciones.create({ pacienteId, descripcion: dto.descripcion, medico: { id: medico.id } }),
    );
  }
}
