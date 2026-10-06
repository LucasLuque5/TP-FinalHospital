import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { HceService } from '../hce/hce.service.js';
import {
  EVENTOS,
  type InternacionFinalizadaEvento,
  type InternacionIniciadaEvento,
  type MedicacionAdministradaEvento,
  type TurnoAtendidoEvento,
} from '../shared/eventos.js';
import type { AsignarCoberturaDto } from './dto/facturacion.dto.js';
import {
  CoberturaPaciente,
  Factura,
  FacturaItem,
  ObraSocial,
  PrecioInsumo,
  Prestacion,
} from './entities/facturacion.entities.js';
import { elegirEstrategia, type TipoCobertura } from './estrategias/estrategias-cobertura.js';

/** Código (en el nomenclador) de la prestación que se factura al atender un turno. */
const CODIGO_CONSULTA = 'CONSULTA_GENERAL';

/** Resultado de validar la cobertura de un paciente. */
export interface CoberturaValidada {
  tipo: TipoCobertura;
  obraSocial: ObraSocial | null;
  numeroAfiliado: string | null;
}

@Injectable()
export class FacturacionService {
  private readonly logger = new Logger(FacturacionService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ObraSocial) private readonly obrasSociales: Repository<ObraSocial>,
    @InjectRepository(CoberturaPaciente) private readonly coberturas: Repository<CoberturaPaciente>,
    @InjectRepository(Prestacion) private readonly prestaciones: Repository<Prestacion>,
    @InjectRepository(PrecioInsumo) private readonly precios: Repository<PrecioInsumo>,
    @InjectRepository(Factura) private readonly facturas: Repository<Factura>,
    @InjectRepository(FacturaItem) private readonly items: Repository<FacturaItem>,
    private readonly hce: HceService,
  ) {}

  // =====================================================================
  // COBERTURAS
  // =====================================================================

  listarObrasSociales(): Promise<ObraSocial[]> {
    return this.obrasSociales.find({ order: { nombre: 'ASC' } });
  }

  listarCoberturas(): Promise<CoberturaPaciente[]> {
    return this.coberturas.find({
      where: { vigente: true },
      relations: { paciente: true, obraSocial: true },
      order: { id: 'ASC' },
    });
  }

  listarPrestaciones(): Promise<Prestacion[]> {
    return this.prestaciones.find({ order: { nombre: 'ASC' } });
  }

  /** Validación de cobertura: ¿qué obra social tiene vigente el paciente? */
  async validarCobertura(pacienteId: number): Promise<CoberturaValidada> {
    await this.hce.obtenerPaciente(pacienteId);
    const cobertura = await this.coberturas.findOne({
      where: { pacienteId, vigente: true },
      relations: { obraSocial: true },
    });
    if (!cobertura) return { tipo: 'PARTICULAR', obraSocial: null, numeroAfiliado: null };
    return {
      tipo: cobertura.obraSocial.tipo,
      obraSocial: cobertura.obraSocial,
      numeroAfiliado: cobertura.numeroAfiliado,
    };
  }

  /** Asigna (o reemplaza) la cobertura vigente de un paciente. */
  async asignarCobertura(dto: AsignarCoberturaDto): Promise<CoberturaPaciente> {
    await this.hce.obtenerPaciente(dto.pacienteId);
    if (!(await this.obrasSociales.existsBy({ id: dto.obraSocialId }))) {
      throw new NotFoundException(`No existe la obra social ${dto.obraSocialId}.`);
    }
    const id = await this.dataSource.transaction(async (manager) => {
      // La cobertura anterior deja de estar vigente (no se borra: queda de historial).
      await manager.update(CoberturaPaciente, { pacienteId: dto.pacienteId, vigente: true }, { vigente: false });
      const nueva = await manager.save(manager.create(CoberturaPaciente, { ...dto, vigente: true }));
      return nueva.id;
    });
    return this.coberturas.findOneOrFail({
      where: { id },
      relations: { paciente: true, obraSocial: true },
    });
  }

  // =====================================================================
  // HU 1.1 - CÁLCULO DINÁMICO DE COSTOS (patrón Strategy)
  // =====================================================================

  async facturarPrestacion(pacienteId: number, prestacionId: number): Promise<Factura> {
    const prestacion = await this.prestaciones.findOneBy({ id: prestacionId });
    if (!prestacion) throw new NotFoundException(`No existe la prestación ${prestacionId}.`);

    // 1) Se averigua la cobertura del paciente...
    const cobertura = await this.validarCobertura(pacienteId);
    // 2) ...se elige la estrategia que le corresponde...
    const estrategia = elegirEstrategia(cobertura.tipo, cobertura.obraSocial?.copagoFijo);
    // 3) ...y se le pide que calcule. Este servicio no sabe (ni le importa)
    //    cuál de las tres estrategias está usando.
    const lineas = estrategia.calcular(prestacion.valorBase);

    const factura = await this.facturas.save(
      this.facturas.create({
        pacienteId,
        internacionId: null,
        tipo: 'PRESTACION',
        estado: 'Cerrada',
        cerradaEn: new Date(),
        items: lineas.map((linea) =>
          this.items.create({
            concepto: prestacion.nombre,
            descripcion: linea.detalle,
            cantidad: 1,
            precioUnitario: linea.importe,
            importe: linea.importe,
            aCargoDe: linea.aCargoDe,
            // Las líneas que no paga el paciente quedan asociadas a la obra social.
            obraSocialId: linea.aCargoDe === 'PACIENTE' ? null : (cobertura.obraSocial?.id ?? null),
            eventoId: null,
          }),
        ),
      }),
    );
    return this.obtenerFactura(factura.id);
  }

  // =====================================================================
  // CONSULTAS Y REPORTES
  // =====================================================================

  listarFacturas(): Promise<Factura[]> {
    return this.facturas.find({
      relations: { paciente: true, items: true },
      order: { id: 'DESC' },
      take: 100,
    });
  }

  async obtenerFactura(id: number): Promise<Factura> {
    const factura = await this.facturas.findOne({
      where: { id },
      relations: { paciente: true, items: { obraSocial: true } },
    });
    if (!factura) throw new NotFoundException(`No existe la factura ${id}.`);
    return factura;
  }

  listarItems(): Promise<FacturaItem[]> {
    return this.items.find({
      relations: { factura: { paciente: true }, obraSocial: true },
      order: { id: 'DESC' },
      take: 200,
    });
  }

  /** Reporte administrativo: totales facturados agrupados por pagador y por concepto. */
  async obtenerResumen() {
    const sumar = (columna: string, alias: string) =>
      this.items
        .createQueryBuilder('item')
        .select(columna, alias)
        .addSelect('COUNT(*)', 'cantidad')
        .addSelect('SUM(item.importe)', 'total')
        .groupBy(columna)
        .orderBy('SUM(item.importe)', 'DESC')
        .getRawMany<Record<string, string>>();

    const [porPagador, porConcepto] = await Promise.all([
      sumar('item.aCargoDe', 'aCargoDe'),
      sumar('item.concepto', 'concepto'),
    ]);
    const aNumeros = (filas: Record<string, string>[]) =>
      filas.map((fila) => ({ ...fila, cantidad: Number(fila.cantidad), total: Number(fila.total) }));

    return { porPagador: aNumeros(porPagador), porConcepto: aNumeros(porConcepto) };
  }

  // =====================================================================
  // OYENTES DE EVENTOS (integración asíncrona con los otros módulos)
  // Ninguno de estos métodos es llamado por un controlador.
  // =====================================================================

  /** Generación de cargos automáticos por atenciones: consulta atendida => se factura. */
  @OnEvent(EVENTOS.TURNO_ATENDIDO, { async: true })
  async alAtenderTurno(evento: TurnoAtendidoEvento): Promise<void> {
    await this.sinInterrumpir(`turno ${evento.turnoId}`, async () => {
      const consulta = await this.prestaciones.findOneBy({ codigo: CODIGO_CONSULTA });
      if (consulta) await this.facturarPrestacion(evento.pacienteId, consulta.id);
    });
  }

  /** Al internarse un paciente se le abre la cuenta de gastos de la estadía. */
  @OnEvent(EVENTOS.INTERNACION_INICIADA, { async: true })
  async alIniciarInternacion(evento: InternacionIniciadaEvento): Promise<void> {
    await this.sinInterrumpir(`internación ${evento.internacionId}`, async () => {
      await this.facturas.save(
        this.facturas.create({
          pacienteId: evento.pacienteId,
          internacionId: evento.internacionId,
          tipo: 'ESTADIA',
          estado: 'Abierta',
          cerradaEn: null,
        }),
      );
    });
  }

  /** Con el alta se cierra la cuenta. */
  @OnEvent(EVENTOS.INTERNACION_FINALIZADA, { async: true })
  async alFinalizarInternacion(evento: InternacionFinalizadaEvento): Promise<void> {
    await this.sinInterrumpir(`internación ${evento.internacionId}`, async () => {
      await this.facturas.update(
        { internacionId: evento.internacionId, estado: 'Abierta' },
        { estado: 'Cerrada', cerradaEn: new Date() },
      );
    });
  }

  /**
   * HU 2.1 - CARGO AUTOMÁTICO POR CONSUMO DE INSUMOS
   * Escucha "MedicacionAdministrada" e imputa el costo a la cuenta del paciente.
   */
  @OnEvent(EVENTOS.MEDICACION_ADMINISTRADA, { async: true })
  async alAdministrarMedicacion(evento: MedicacionAdministradaEvento): Promise<void> {
    await this.sinInterrumpir(`evento ${evento.eventoId}`, async () => {
      const cuenta = await this.facturas.findOneBy({
        pacienteId: evento.pacienteId,
        tipo: 'ESTADIA',
        estado: 'Abierta',
      });
      if (!cuenta) {
        this.logger.warn(`El paciente ${evento.pacienteId} no tiene una cuenta de gastos activa.`);
        return;
      }

      // Se consulta el precio unitario en la lista de precios vigente.
      const precio = await this.precios.findOne({
        where: { insumoId: evento.insumoId, vigenteHasta: IsNull() },
        order: { vigenteDesde: 'DESC' },
      });
      if (!precio) {
        this.logger.warn(`El insumo ${evento.insumoId} no tiene precio vigente.`);
        return;
      }

      await this.items.save(
        this.items.create({
          facturaId: cuenta.id,
          concepto: 'Insumos de Farmacia',
          descripcion: evento.insumoNombre,
          cantidad: evento.cantidad,
          precioUnitario: precio.precioUnitario,
          importe: precio.precioUnitario * evento.cantidad,
          aCargoDe: 'PACIENTE',
          obraSocialId: null,
          // Vínculo con el evento original: permite auditar de dónde salió el cargo.
          eventoId: evento.eventoId,
        }),
      );
    });
  }

  /**
   * Los oyentes corren en segundo plano: si fallan, el error se registra en
   * el log pero NO se le devuelve a quien publicó el evento (la operación
   * médica ya terminó bien y no debe verse afectada).
   */
  private async sinInterrumpir(origen: string, tarea: () => Promise<void>): Promise<void> {
    try {
      await tarea();
    } catch (error) {
      this.logger.error(`No se pudo generar el cargo automático (${origen})`, error);
    }
  }
}
