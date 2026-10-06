import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type EntityManager, IsNull, Repository } from 'typeorm';
import { HceService } from '../hce/hce.service.js';
import {
  EVENTOS,
  type CamaEstadoCambiadoEvento,
  type InternacionFinalizadaEvento,
  type InternacionIniciadaEvento,
} from '../shared/eventos.js';
import type { AsignarCamaDto } from './dto/recursos.dto.js';
import { Cama, Internacion } from './entities/camas.entities.js';
import { AccionCama, EstadoCama, siguienteEstadoCama } from './maquina-estados-cama.js';

/** Servicio de camas e internaciones. */
@Injectable()
export class RecursosService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Cama) private readonly camas: Repository<Cama>,
    @InjectRepository(Internacion) private readonly internaciones: Repository<Internacion>,
    private readonly hce: HceService,
    private readonly eventos: EventEmitter2,
  ) {}

  // =====================================================================
  // MAPA DE CAMAS
  // =====================================================================

  /** Todas las camas con su habitación y, si está ocupada, el paciente internado. */
  async obtenerMapaDeCamas() {
    const [camas, activas] = await Promise.all([
      this.camas.find({ relations: { habitacion: true }, order: { codigo: 'ASC' } }),
      this.listarInternacionesActivas(),
    ]);
    return camas.map((cama) => ({
      ...cama,
      internacion: activas.find((internacion) => internacion.camaId === cama.id) ?? null,
    }));
  }

  listarInternacionesActivas(): Promise<Internacion[]> {
    return this.internaciones.find({
      where: { fechaEgreso: IsNull() },
      relations: { paciente: true, cama: { habitacion: true } },
      order: { fechaIngreso: 'ASC' },
    });
  }

  /** Historial completo de ocupación de camas. */
  listarHistorial(): Promise<Internacion[]> {
    return this.internaciones.find({
      relations: { paciente: true, cama: { habitacion: true } },
      order: { fechaIngreso: 'DESC' },
      take: 100,
    });
  }

  /** La usa Enfermería: valida que la internación exista y siga abierta. */
  async obtenerInternacionActiva(id: number): Promise<Internacion> {
    const internacion = await this.internaciones.findOne({
      where: { id, fechaEgreso: IsNull() },
      relations: { paciente: true, cama: { habitacion: true } },
    });
    if (!internacion) throw new NotFoundException(`No existe una internación activa con ID ${id}.`);
    return internacion;
  }

  /** La usa Enfermería: internación activa de un paciente (o null si no está internado). */
  buscarInternacionActivaDePaciente(pacienteId: number): Promise<Internacion | null> {
    return this.internaciones.findOne({
      where: { pacienteId, fechaEgreso: IsNull() },
      relations: { cama: { habitacion: true } },
    });
  }

  // =====================================================================
  // HU 1.1 - ASIGNACIÓN SEGURA DE CAMA (bloqueo optimista)
  // =====================================================================

  async asignarCama(camaId: number, dto: AsignarCamaDto): Promise<Internacion> {
    await this.hce.obtenerPaciente(dto.pacienteId);

    if (await this.buscarInternacionActivaDePaciente(dto.pacienteId)) {
      throw new ConflictException('El paciente ya se encuentra internado en otra cama.');
    }

    // 1) Se LEE la cama sin bloquear nada. Nos guardamos su número de versión.
    const cama = await this.buscarCama(camaId);
    if (cama.estado === EstadoCama.Ocupada) {
      throw new ConflictException(`La cama ${cama.codigo} acaba de ser ocupada.`);
    }

    const internacionId = await this.dataSource.transaction(async (manager) => {
      // 2) Se intenta el cambio de estado "si nadie tocó la cama desde que la leí".
      await this.cambiarEstado(manager, cama, AccionCama.AsignarPaciente);

      // 3) Se persiste la relación Paciente + Cama + marca temporal de ingreso.
      const internacion = await manager.save(
        manager.create(Internacion, {
          camaId: cama.id,
          pacienteId: dto.pacienteId,
          motivoIngreso: dto.motivoIngreso,
          diagnosticoInicial: dto.diagnosticoInicial ?? null,
          fechaEgreso: null,
        }),
      );
      return internacion.id;
    });

    // Evento de ingreso: lo escuchan Enfermería (arma el protocolo con el
    // Builder) y Facturación (abre la cuenta de gastos de la estadía).
    const evento: InternacionIniciadaEvento = {
      internacionId,
      pacienteId: dto.pacienteId,
      camaCodigo: cama.codigo,
      motivoIngreso: dto.motivoIngreso,
    };
    this.eventos.emit(EVENTOS.INTERNACION_INICIADA, evento);
    this.publicarCambio(cama, EstadoCama.Libre, EstadoCama.Ocupada);

    return this.obtenerInternacionActiva(internacionId);
  }

  // =====================================================================
  // HU 2.1 - ALTA, LIMPIEZA Y MANTENIMIENTO (máquina de estados)
  // =====================================================================

  /** Alta médica: cierra la internación y la cama pasa SOLA a "En limpieza". */
  async darDeAlta(internacionId: number): Promise<Internacion> {
    const internacion = await this.obtenerInternacionActiva(internacionId);
    const cama = await this.buscarCama(internacion.camaId);

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Internacion, { id: internacionId }, { fechaEgreso: new Date() });
      await this.cambiarEstado(manager, cama, AccionCama.LiberarPorAlta);
    });

    const evento: InternacionFinalizadaEvento = {
      internacionId,
      pacienteId: internacion.pacienteId,
    };
    this.eventos.emit(EVENTOS.INTERNACION_FINALIZADA, evento);
    this.publicarCambio(cama, EstadoCama.Ocupada, EstadoCama.EnLimpieza);

    return (await this.internaciones.findOne({
      where: { id: internacionId },
      relations: { paciente: true, cama: true },
    }))!;
  }

  /** Acciones manuales sobre una cama: confirmar limpieza, bloquear, desbloquear. */
  async aplicarAccion(camaId: number, accion: AccionCama): Promise<Cama> {
    const cama = await this.buscarCama(camaId);
    const estadoAnterior = cama.estado;
    const estadoNuevo = await this.dataSource.transaction((manager) =>
      this.cambiarEstado(manager, cama, accion),
    );
    this.publicarCambio(cama, estadoAnterior, estadoNuevo);
    return this.buscarCama(camaId);
  }

  // =====================================================================
  // Auxiliares
  // =====================================================================

  /**
   * Cambia el estado de una cama aplicando DOS protecciones:
   *
   * a) Máquina de estados: valida que la acción esté permitida desde el
   *    estado actual (ej. no se puede asignar una cama "En limpieza").
   *
   * b) BLOQUEO OPTIMISTA: el UPDATE lleva la condición "AND version = X",
   *    donde X es la versión que se leyó antes. Si otro usuario modificó
   *    la cama en el medio, su versión ya es X+1, el UPDATE no encuentra
   *    ninguna fila (affected = 0) y sabemos que perdimos la carrera.
   *
   *    UPDATE camas SET estado = @nuevo, version = version + 1
   *    WHERE id = @id AND version = @versionLeida
   */
  private async cambiarEstado(
    manager: EntityManager,
    cama: Cama,
    accion: AccionCama,
  ): Promise<EstadoCama> {
    const estadoNuevo = siguienteEstadoCama(cama.estado, accion);

    const resultado = await manager
      .createQueryBuilder()
      .update(Cama)
      .set({ estado: estadoNuevo, version: () => 'version + 1' })
      .where('id = :id AND version = :version', { id: cama.id, version: cama.version })
      .execute();

    if (resultado.affected !== 1) {
      throw new ConflictException(
        accion === AccionCama.AsignarPaciente
          ? `La cama ${cama.codigo} acaba de ser ocupada.`
          : `La cama ${cama.codigo} fue modificada por otro usuario. Actualice el mapa e intente de nuevo.`,
      );
    }
    return estadoNuevo;
  }

  /** Publica el evento que actualiza en tiempo real los monitores de administración. */
  private publicarCambio(cama: Cama, estadoAnterior: EstadoCama, estadoNuevo: EstadoCama): void {
    const evento: CamaEstadoCambiadoEvento = {
      camaId: cama.id,
      camaCodigo: cama.codigo,
      estadoAnterior,
      estadoNuevo,
    };
    this.eventos.emit(EVENTOS.CAMA_ESTADO_CAMBIADO, evento);
  }

  private async buscarCama(id: number): Promise<Cama> {
    const cama = await this.camas.findOne({ where: { id }, relations: { habitacion: true } });
    if (!cama) throw new NotFoundException(`No existe la cama ${id}.`);
    return cama;
  }
}
