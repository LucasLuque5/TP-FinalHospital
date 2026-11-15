import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { UsuarioActual } from '../iam/usuario-actual.js';
import { RecursosService } from '../recursos/recursos.service.js';
import { EVENTOS, type InternacionIniciadaEvento } from '../shared/eventos.js';
import { NotificacionesService } from '../shared/notificaciones/notificaciones.service.js';
import { Protocolo, ProtocoloTarea } from './entities/enfermeria.entities.js';
import { DirectorDeProtocolos, elegirBuilder } from './protocolos/protocolo-builder.js';

@Injectable()
export class ProtocolosService {
  private readonly logger = new Logger(ProtocolosService.name);
  private readonly director = new DirectorDeProtocolos();

  constructor(
    @InjectRepository(Protocolo) private readonly protocolos: Repository<Protocolo>,
    @InjectRepository(ProtocoloTarea) private readonly tareas: Repository<ProtocoloTarea>,
    private readonly recursos: RecursosService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  @OnEvent(EVENTOS.INTERNACION_INICIADA, { async: true })
  async alIniciarInternacion(evento: InternacionIniciadaEvento): Promise<void> {
    try {
      const builder = elegirBuilder(evento.motivoIngreso);
      if (!builder) return;

      const armado = this.director.construirProtocoloDeIngreso(builder);

      await this.protocolos.save(
        this.protocolos.create({
          internacionId: evento.internacionId,
          pacienteId: evento.pacienteId,
          nombre: armado.nombre,
          tareas: armado.tareas.map((descripcion, indice) =>
            this.tareas.create({
              orden: indice + 1,
              descripcion,
              completada: false,
              completadaPor: null,
              completadaEn: null,
            }),
          ),
        }),
      );
      this.notificaciones.difundirActualizacion('protocolos');
    } catch (error) {
      this.logger.error(`No se pudo generar el protocolo (internación ${evento.internacionId})`, error);
    }
  }

  async listarActivos(): Promise<Protocolo[]> {
    const internaciones = await this.recursos.listarInternacionesActivas();
    const ids = internaciones.map((internacion) => internacion.id);
    if (ids.length === 0) return [];

    return this.protocolos
      .createQueryBuilder('protocolo')
      .leftJoinAndSelect('protocolo.paciente', 'paciente')
      .leftJoinAndSelect('protocolo.tareas', 'tarea')
      .where('protocolo.internacionId IN (:...ids)', { ids })
      .orderBy('protocolo.id', 'DESC')
      .addOrderBy('tarea.orden', 'ASC')
      .getMany();
  }

  async completarTarea(tareaId: number, enfermero: UsuarioActual): Promise<ProtocoloTarea> {
    const tarea = await this.tareas.findOneBy({ id: tareaId });
    if (!tarea) throw new NotFoundException(`No existe la tarea ${tareaId}.`);
    if (tarea.completada) throw new ConflictException('La tarea ya estaba completada.');

    tarea.completada = true;
    tarea.completadaPor = enfermero.id;
    tarea.completadaEn = new Date();
    const guardada = await this.tareas.save(tarea);
    this.notificaciones.difundirActualizacion('protocolos');
    return guardada;
  }
}
