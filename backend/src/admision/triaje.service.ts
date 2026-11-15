import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HceService } from '../hce/hce.service.js';
import { NombreRol, type UsuarioActual } from '../iam/usuario-actual.js';
import { NotificacionesService } from '../shared/notificaciones/notificaciones.service.js';
import type { RegistrarTriajeDto } from './dto/admision.dto.js';
import { NIVELES_TRIAJE, Triaje } from './entities/triaje.entity.js';

@Injectable()
export class TriajeService {
  constructor(
    @InjectRepository(Triaje) private readonly triajes: Repository<Triaje>,
    private readonly hce: HceService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  async obtenerCola() {
    const enEspera = await this.triajes.find({
      where: { estado: 'En espera' },
      relations: { paciente: true },
      order: { nivel: 'ASC', ingresoEn: 'ASC', id: 'ASC' },
    });
    return enEspera.map((triaje, indice) => ({
      ...triaje,
      posicion: indice + 1,
      nivelNombre: NIVELES_TRIAJE[triaje.nivel].nombre,
      color: NIVELES_TRIAJE[triaje.nivel].color,
    }));
  }

  async registrar(dto: RegistrarTriajeDto, enfermero: UsuarioActual) {
    const paciente = await this.hce.obtenerPaciente(dto.pacienteId);

    const yaEnCola = await this.triajes.existsBy({ pacienteId: dto.pacienteId, estado: 'En espera' });
    if (yaEnCola) {
      throw new ConflictException('El paciente ya está en la cola de guardia.');
    }

    const guardado = await this.triajes.save(
      this.triajes.create({ ...dto, enfermeroId: enfermero.id, estado: 'En espera', atendidoEn: null }),
    );

    if (dto.nivel === 1) {
      await this.notificaciones.notificar({
        rolDestino: NombreRol.Medico,
        prioridad: 'ALTA',
        titulo: 'CÓDIGO ROJO en guardia',
        mensaje: `${paciente.nombre} ${paciente.apellido} ingresó con Riesgo Vital. Motivo: ${dto.motivo}`,
      });
    }
    this.notificaciones.difundirActualizacion('guardia');

    const cola = await this.obtenerCola();
    return cola.find((item) => item.id === guardado.id);
  }

  async marcarAtendido(id: number): Promise<Triaje> {
    const triaje = await this.triajes.findOneBy({ id });
    if (!triaje) throw new NotFoundException(`No existe el ingreso de guardia ${id}.`);
    if (triaje.estado !== 'En espera') {
      throw new ConflictException('El paciente ya fue atendido.');
    }
    triaje.estado = 'Atendido';
    triaje.atendidoEn = new Date();
    const guardado = await this.triajes.save(triaje);
    this.notificaciones.difundirActualizacion('guardia');
    return guardado;
  }
}
