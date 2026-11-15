import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NombreRol, type UsuarioActual } from '../iam/usuario-actual.js';
import { InventarioService } from '../recursos/inventario.service.js';
import { RecursosService } from '../recursos/recursos.service.js';
import { EVENTOS, type MedicacionAdministradaEvento } from '../shared/eventos.js';
import { NotificacionesService } from '../shared/notificaciones/notificaciones.service.js';
import { aHoraLocal, sumarMinutos } from '../shared/utilidades.js';
import type {
  CrearIndicacionDto,
  CrearNotaDto,
  RegistrarSignosVitalesDto,
} from './dto/enfermeria.dto.js';
import {
  AdministracionMedicacion,
  IndicacionMedica,
  NotaEnfermeria,
  SignoVital,
} from './entities/enfermeria.entities.js';
import { detectarAnomalias } from './rangos-signos-vitales.js';

export const MARGEN_ADMINISTRACION_MINUTOS = 30;

@Injectable()
export class EnfermeriaService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(SignoVital) private readonly signos: Repository<SignoVital>,
    @InjectRepository(NotaEnfermeria) private readonly notas: Repository<NotaEnfermeria>,
    @InjectRepository(IndicacionMedica) private readonly indicaciones: Repository<IndicacionMedica>,
    @InjectRepository(AdministracionMedicacion)
    private readonly administraciones: Repository<AdministracionMedicacion>,
    private readonly recursos: RecursosService,
    private readonly inventario: InventarioService,
    private readonly notificaciones: NotificacionesService,
    private readonly eventos: EventEmitter2,
  ) {}

  listarSignos(pacienteId?: number): Promise<SignoVital[]> {
    return this.signos.find({
      where: pacienteId ? { pacienteId } : {},
      relations: { paciente: true, enfermero: true },
      order: { id: 'DESC' },
      take: 50,
    });
  }

  async registrarSignos(dto: RegistrarSignosVitalesDto, enfermero: UsuarioActual) {
    const internacion = await this.recursos.obtenerInternacionActiva(dto.internacionId);
    const anomalias = detectarAnomalias(dto);
    const fueraDeRango = anomalias.length > 0;

    const registro = await this.dataSource.transaction(async (manager) => {
      const guardado = await manager.save(
        manager.create(SignoVital, {
          internacionId: internacion.id,
          pacienteId: internacion.pacienteId,
          enfermeroId: enfermero.id,
          presionSistolica: dto.presionSistolica,
          presionDiastolica: dto.presionDiastolica,
          frecuenciaCardiaca: dto.frecuenciaCardiaca,
          temperatura: dto.temperatura,
          fueraDeRango,
        }),
      );

      await manager.save(
        manager.create(NotaEnfermeria, {
          pacienteId: internacion.pacienteId,
          enfermeroId: enfermero.id,
          automatica: true,
          texto: fueraDeRango
            ? `Control de signos vitales con valores fuera de rango: ${anomalias.join('; ')}.`
            : 'Control de signos vitales realizado con éxito. Valores dentro de los rangos normales.',
        }),
      );
      return guardado;
    });

    if (fueraDeRango) {
      const { paciente, cama } = internacion;
      await this.notificaciones.notificar({
        rolDestino: NombreRol.Medico,
        prioridad: 'ALTA',
        titulo: 'Signos vitales fuera de rango',
        mensaje:
          `${paciente.nombre} ${paciente.apellido} (cama ${cama.codigo}, ${cama.habitacion.sector}): ` +
          anomalias.join('; '),
      });
    }
    return registro;
  }

  listarNotas(pacienteId: number): Promise<NotaEnfermeria[]> {
    return this.notas.find({
      where: { pacienteId },
      relations: { enfermero: true },
      order: { id: 'DESC' },
      take: 50,
    });
  }

  async crearNota(dto: CrearNotaDto, enfermero: UsuarioActual): Promise<NotaEnfermeria> {
    await this.exigirInternado(dto.pacienteId);
    return this.notas.save(
      this.notas.create({ ...dto, enfermeroId: enfermero.id, automatica: false }),
    );
  }

  async crearIndicacion(dto: CrearIndicacionDto, medico: UsuarioActual): Promise<IndicacionMedica> {
    await this.exigirInternado(dto.pacienteId);
    await this.inventario.obtenerInsumo(dto.insumoId);

    return this.dataSource.transaction(async (manager) => {
      const indicacion = await manager.save(
        manager.create(IndicacionMedica, {
          pacienteId: dto.pacienteId,
          medicoId: medico.id,
          insumoId: dto.insumoId,
          descripcion: dto.descripcion,
          frecuenciaHoras: dto.frecuenciaHoras,
          activa: true,
        }),
      );

      const primera = new Date(dto.primeraDosis);
      const dosis = Array.from({ length: dto.cantidadDosis }, (_, numero) =>
        manager.create(AdministracionMedicacion, {
          indicacionId: indicacion.id,
          horaProgramada: sumarMinutos(primera, numero * dto.frecuenciaHoras * 60),
          estado: 'Pendiente',
          administradaEn: null,
          enfermeroId: null,
          eventoId: null,
        }),
      );
      await manager.save(dosis);
      return indicacion;
    });
  }

  listarAdministraciones(): Promise<AdministracionMedicacion[]> {
    return this.administraciones.find({
      where: { indicacion: { activa: true } },
      relations: { indicacion: { paciente: true, insumo: true }, enfermero: true },
      order: { horaProgramada: 'ASC' },
      take: 200,
    });
  }

  async administrar(administracionId: number, enfermero: UsuarioActual) {
    const evento = await this.dataSource.transaction(async (manager) => {
      const dosis = await manager.findOne(AdministracionMedicacion, {
        where: { id: administracionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!dosis) throw new NotFoundException(`No existe la dosis ${administracionId}.`);
      if (dosis.estado === 'Administrada') {
        throw new ConflictException('Esta dosis ya fue administrada.');
      }

      const indicacion = await manager.findOneOrFail(IndicacionMedica, {
        where: { id: dosis.indicacionId },
        relations: { insumo: true },
      });
      if (!indicacion.activa) {
        throw new UnprocessableEntityException('La indicación médica ya no está activa.');
      }

      const ahora = new Date();
      const desde = sumarMinutos(dosis.horaProgramada, -MARGEN_ADMINISTRACION_MINUTOS);
      const hasta = sumarMinutos(dosis.horaProgramada, MARGEN_ADMINISTRACION_MINUTOS);
      if (ahora < desde || ahora > hasta) {
        throw new UnprocessableEntityException(
          `Fuera del margen permitido: la dosis de las ${aHoraLocal(dosis.horaProgramada)} ` +
            `solo puede administrarse entre las ${aHoraLocal(desde)} y las ${aHoraLocal(hasta)}.`,
        );
      }

      dosis.estado = 'Administrada';
      dosis.administradaEn = ahora;
      dosis.enfermeroId = enfermero.id;
      dosis.eventoId = randomUUID();
      await manager.save(dosis);

      const datosEvento: MedicacionAdministradaEvento = {
        eventoId: dosis.eventoId,
        administracionId: dosis.id,
        pacienteId: indicacion.pacienteId,
        insumoId: indicacion.insumoId,
        insumoNombre: indicacion.insumo.nombre,
        cantidad: 1,
        enfermeroId: enfermero.id,
      };
      return datosEvento;
    });

    this.eventos.emit(EVENTOS.MEDICACION_ADMINISTRADA, evento);

    return this.administraciones.findOne({
      where: { id: administracionId },
      relations: { indicacion: { paciente: true, insumo: true }, enfermero: true },
    });
  }

  private async exigirInternado(pacienteId: number): Promise<void> {
    if (!(await this.recursos.buscarInternacionActivaDePaciente(pacienteId))) {
      throw new UnprocessableEntityException('El paciente no se encuentra internado.');
    }
  }
}
