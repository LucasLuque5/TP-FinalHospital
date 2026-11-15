import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { And, DataSource, type EntityManager, LessThan, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { HceService } from '../hce/hce.service.js';
import { IamService } from '../iam/iam.service.js';
import { NombreRol, type UsuarioActual } from '../iam/usuario-actual.js';
import { EVENTOS, type TurnoAtendidoEvento } from '../shared/eventos.js';
import { NotificacionesService } from '../shared/notificaciones/notificaciones.service.js';
import { aFechaLocal, aHoraLocal, inicioDelDia, sumarMinutos } from '../shared/utilidades.js';
import type {
  AgregarListaEsperaDto,
  GenerarAgendaDto,
  InsertarEntreturnoDto,
} from './dto/admision.dto.js';
import { ListaEspera } from './entities/lista-espera.entity.js';
import { Turno } from './entities/turno.entity.js';
import { NombreEstadoTurno } from './estados/estado-turno.js';
import { obtenerEstado } from './estados/estados-concretos.js';

export type AccionTurno = 'confirmar' | 'llegada' | 'atender' | 'cancelar';

@Injectable()
export class TurnosService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Turno) private readonly turnos: Repository<Turno>,
    @InjectRepository(ListaEspera) private readonly listaEspera: Repository<ListaEspera>,
    private readonly hce: HceService,
    private readonly iam: IamService,
    private readonly notificaciones: NotificacionesService,
    private readonly eventos: EventEmitter2,
  ) {}

  listar(fecha: string, medicoId?: number): Promise<Turno[]> {
    const desde = inicioDelDia(fecha);
    const hasta = sumarMinutos(desde, 24 * 60);
    return this.turnos.find({
      where: {
        fechaHoraInicio: And(MoreThanOrEqual(desde), LessThan(hasta)),
        ...(medicoId ? { medicoId } : {}),
      },
      relations: { paciente: true, medico: true },
      order: { fechaHoraInicio: 'ASC', id: 'ASC' },
    });
  }

  listarDePaciente(pacienteId: number): Promise<Turno[]> {
    return this.turnos.find({
      where: { pacienteId },
      relations: { medico: true },
      order: { fechaHoraInicio: 'DESC' },
    });
  }

  async generarAgenda(dto: GenerarAgendaDto): Promise<Turno[]> {
    await this.iam.obtenerMedico(dto.medicoId);

    const dia = inicioDelDia(dto.fecha);
    const [horaDesde, minutoDesde] = dto.horaInicio.split(':').map(Number);
    const [horaHasta, minutoHasta] = dto.horaFin.split(':').map(Number);
    const inicio = sumarMinutos(dia, horaDesde * 60 + minutoDesde);
    const fin = sumarMinutos(dia, horaHasta * 60 + minutoHasta);
    if (fin <= inicio) {
      throw new UnprocessableEntityException('La hora de fin debe ser posterior a la de inicio.');
    }

    const yaHayTurnos = await this.turnos.existsBy({
      medicoId: dto.medicoId,
      estado: Not(NombreEstadoTurno.Cancelado),
      fechaHoraInicio: And(MoreThanOrEqual(inicio), LessThan(fin)),
    });
    if (yaHayTurnos) {
      throw new ConflictException('El médico ya tiene turnos generados en ese rango horario.');
    }

    const nuevos: Turno[] = [];
    for (
      let hora = inicio;
      sumarMinutos(hora, dto.duracionMinutos) <= fin;
      hora = sumarMinutos(hora, dto.duracionMinutos)
    ) {
      nuevos.push(this.nuevoTurnoDisponible(dto.medicoId, hora, dto.duracionMinutos));
    }
    const guardados = await this.turnos.save(nuevos);
    this.notificaciones.difundirActualizacion('turnos');
    return guardados;
  }

  async reservar(turnoId: number, pacienteId: number): Promise<Turno> {
    await this.hce.obtenerPaciente(pacienteId);

    await this.dataSource.transaction(async (manager) => {
      const turno = await this.bloquearTurno(manager, turnoId);

      if (turno.estado !== NombreEstadoTurno.Disponible) {
        throw new ConflictException('El turno acaba de ser ocupado por otro paciente.');
      }

      obtenerEstado(turno.estado).reservar(turno);
      turno.pacienteId = pacienteId;
      await manager.save(turno);
    });

    this.notificaciones.difundirActualizacion('turnos');
    return this.buscarConDatos(turnoId);
  }

  async cambiarEstado(turnoId: number, accion: AccionTurno, usuario: UsuarioActual): Promise<Turno> {
    if (accion === 'cancelar') return this.cancelar(turnoId, usuario);

    await this.dataSource.transaction(async (manager) => {
      const turno = await this.bloquearTurno(manager, turnoId);
      this.verificarPermisoSobreTurno(turno, accion, usuario);

      const estado = obtenerEstado(turno.estado);
      if (accion === 'confirmar') estado.confirmar(turno);
      if (accion === 'llegada') estado.registrarLlegada(turno);
      if (accion === 'atender') estado.atender(turno);

      await manager.save(turno);
    });

    const turno = await this.buscarConDatos(turnoId);
    const paciente = `${turno.paciente!.nombre} ${turno.paciente!.apellido}`;

    if (accion === 'llegada') {
      await this.notificaciones.notificar({
        rolDestino: NombreRol.Medico,
        usuarioDestinoId: turno.medicoId,
        prioridad: 'NORMAL',
        titulo: 'Paciente en sala de espera',
        mensaje: `${paciente} ya se anunció en recepción (turno de las ${aHoraLocal(turno.fechaHoraInicio)}).`,
      });
    }
    if (accion === 'atender') {
      const evento: TurnoAtendidoEvento = {
        turnoId: turno.id,
        pacienteId: turno.pacienteId!,
        medicoId: turno.medicoId,
      };
      this.eventos.emit(EVENTOS.TURNO_ATENDIDO, evento);
    }

    this.notificaciones.difundirActualizacion('turnos');
    return turno;
  }

  private async cancelar(turnoId: number, usuario: UsuarioActual): Promise<Turno> {
    const promovido = await this.dataSource.transaction(async (manager) => {
      const turno = await this.bloquearTurno(manager, turnoId);
      this.verificarPermisoSobreTurno(turno, 'cancelar', usuario);

      obtenerEstado(turno.estado).cancelar(turno);
      await manager.save(turno);

      const reemplazo = this.nuevoTurnoDisponible(
        turno.medicoId,
        turno.fechaHoraInicio,
        turno.duracionMinutos,
      );
      reemplazo.esEntreturno = turno.esEntreturno;
      reemplazo.tiempoReducido = turno.tiempoReducido;

      const primeroEnEspera = await manager.findOne(ListaEspera, {
        where: {
          medicoId: turno.medicoId,
          fecha: aFechaLocal(turno.fechaHoraInicio),
          estado: 'En espera',
        },
        order: { creadoEn: 'ASC', id: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });

      if (primeroEnEspera) {
        obtenerEstado(reemplazo.estado).reservar(reemplazo);
        reemplazo.pacienteId = primeroEnEspera.pacienteId;
      }
      await manager.save(reemplazo);

      if (primeroEnEspera) {
        primeroEnEspera.estado = 'Asignado';
        primeroEnEspera.turnoAsignadoId = reemplazo.id;
        await manager.save(primeroEnEspera);
        return { pacienteId: primeroEnEspera.pacienteId, turnoId: reemplazo.id };
      }
      return null;
    });

    if (promovido) {
      const nuevo = await this.buscarConDatos(promovido.turnoId);
      const paciente = await this.hce.obtenerPaciente(promovido.pacienteId);
      await this.notificaciones.notificar({
        rolDestino: NombreRol.Recepcionista,
        prioridad: 'ALTA',
        titulo: 'Turno asignado desde lista de espera',
        mensaje:
          `Avisar a ${paciente.nombre} ${paciente.apellido}: tiene turno confirmado a las ` +
          `${aHoraLocal(nuevo.fechaHoraInicio)} con Dr/a. ${nuevo.medico.apellido}.`,
      });
    }

    this.notificaciones.difundirActualizacion('turnos');
    return this.buscarConDatos(turnoId);
  }

  listarEspera(fecha: string, medicoId?: number): Promise<ListaEspera[]> {
    return this.listaEspera.find({
      where: { fecha, estado: 'En espera', ...(medicoId ? { medicoId } : {}) },
      relations: { paciente: true, medico: true },
      order: { creadoEn: 'ASC', id: 'ASC' },
    });
  }

  async agregarAListaEspera(dto: AgregarListaEsperaDto): Promise<ListaEspera> {
    await this.iam.obtenerMedico(dto.medicoId);
    await this.hce.obtenerPaciente(dto.pacienteId);

    const yaEsta = await this.listaEspera.existsBy({
      medicoId: dto.medicoId,
      pacienteId: dto.pacienteId,
      fecha: dto.fecha,
      estado: 'En espera',
    });
    if (yaEsta) {
      throw new ConflictException('El paciente ya está en la lista de espera de ese médico para ese día.');
    }

    const guardado = await this.listaEspera.save(
      this.listaEspera.create({ ...dto, estado: 'En espera', turnoAsignadoId: null }),
    );
    this.notificaciones.difundirActualizacion('turnos');
    return guardado;
  }

  async insertarEntreturno(dto: InsertarEntreturnoDto): Promise<Turno> {
    await this.iam.obtenerMedico(dto.medicoId);
    await this.hce.obtenerPaciente(dto.pacienteId);
    const horaEntreturno = new Date(dto.fechaHora);

    const idNuevo = await this.dataSource.transaction(async (manager) => {
      const afectado = await manager
        .createQueryBuilder(Turno, 't')
        .setLock('pessimistic_write')
        .where('t.medicoId = :medicoId', { medicoId: dto.medicoId })
        .andWhere('t.estado NOT IN (:...finales)', {
          finales: [NombreEstadoTurno.Cancelado, NombreEstadoTurno.Atendido],
        })
        .andWhere('t.fechaHoraInicio < :hora', { hora: horaEntreturno })
        .andWhere('DATEADD(MINUTE, t.duracionMinutos, t.fechaHoraInicio) > :hora', {
          hora: horaEntreturno,
        })
        .getOne();

      if (!afectado) {
        throw new UnprocessableEntityException(
          'No hay un turno vigente que contenga ese horario. El entreturno debe ubicarse dentro de un turno existente.',
        );
      }

      const minutosAntes = Math.round(
        (horaEntreturno.getTime() - afectado.fechaHoraInicio.getTime()) / 60_000,
      );
      const minutosEntreturno = afectado.duracionMinutos - minutosAntes;

      afectado.duracionMinutos = minutosAntes;
      afectado.tiempoReducido = true;
      await manager.save(afectado);

      const entreturno = this.nuevoTurnoDisponible(dto.medicoId, horaEntreturno, minutosEntreturno);
      obtenerEstado(entreturno.estado).reservar(entreturno);
      entreturno.pacienteId = dto.pacienteId;
      entreturno.esEntreturno = true;
      entreturno.tiempoReducido = true;
      await manager.save(entreturno);

      return entreturno.id;
    });

    this.notificaciones.difundirActualizacion('turnos');
    return this.buscarConDatos(idNuevo);
  }

  private async bloquearTurno(manager: EntityManager, id: number): Promise<Turno> {
    const turno = await manager.findOne(Turno, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!turno) throw new NotFoundException(`No existe el turno ${id}.`);
    return turno;
  }

  private async buscarConDatos(id: number): Promise<Turno> {
    const turno = await this.turnos.findOne({
      where: { id },
      relations: { paciente: true, medico: true },
    });
    if (!turno) throw new NotFoundException(`No existe el turno ${id}.`);
    return turno;
  }

  private nuevoTurnoDisponible(medicoId: number, inicio: Date, duracionMinutos: number): Turno {
    return this.turnos.create({
      medicoId,
      pacienteId: null,
      fechaHoraInicio: inicio,
      duracionMinutos,
      estado: NombreEstadoTurno.Disponible,
      esEntreturno: false,
      tiempoReducido: false,
    });
  }

  private verificarPermisoSobreTurno(turno: Turno, accion: AccionTurno, usuario: UsuarioActual): void {
    if (usuario.rol === NombreRol.Paciente && turno.pacienteId !== usuario.pacienteId) {
      throw new ForbiddenException('Solo puede operar sobre sus propios turnos.');
    }
    if (accion === 'atender' && turno.medicoId !== usuario.id) {
      throw new ForbiddenException('Solo el médico del turno puede marcarlo como atendido.');
    }
  }
}
