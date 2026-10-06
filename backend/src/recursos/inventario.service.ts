import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NombreRol, type UsuarioActual } from '../iam/usuario-actual.js';
import { EVENTOS, type MedicacionAdministradaEvento } from '../shared/eventos.js';
import { NotificacionesService } from '../shared/notificaciones/notificaciones.service.js';
import type { IngresoStockDto } from './dto/recursos.dto.js';
import { Insumo, MovimientoInventario } from './entities/inventario.entities.js';

/** Gestión básica de inventario de insumos médicos (Épica 3 de Recursos). */
@Injectable()
export class InventarioService {
  private readonly logger = new Logger(InventarioService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Insumo) private readonly insumos: Repository<Insumo>,
    @InjectRepository(MovimientoInventario)
    private readonly movimientos: Repository<MovimientoInventario>,
    private readonly notificaciones: NotificacionesService,
  ) {}

  listarInsumos(): Promise<Insumo[]> {
    return this.insumos.find({ order: { nombre: 'ASC' } });
  }

  listarMovimientos(): Promise<MovimientoInventario[]> {
    return this.movimientos.find({
      relations: { insumo: true },
      order: { id: 'DESC' },
      take: 100,
    });
  }

  /** La usa Enfermería para validar el insumo de una indicación médica. */
  async obtenerInsumo(id: number): Promise<Insumo> {
    const insumo = await this.insumos.findOneBy({ id });
    if (!insumo) throw new NotFoundException(`No existe el insumo ${id}.`);
    return insumo;
  }

  /** Reposición de stock (entrada manual). */
  async registrarIngreso(insumoId: number, dto: IngresoStockDto, usuario: UsuarioActual) {
    await this.obtenerInsumo(insumoId);
    await this.dataSource.transaction(async (manager) => {
      // Incremento atómico: la suma la hace la base de datos, no el programa.
      await manager.increment(Insumo, { id: insumoId }, 'stock', dto.cantidad);
      await manager.save(
        manager.create(MovimientoInventario, {
          insumoId,
          tipo: 'INGRESO',
          cantidad: dto.cantidad,
          motivo: dto.motivo,
          eventoId: null,
          usuarioId: usuario.id,
        }),
      );
    });
    this.notificaciones.difundirActualizacion('inventario');
    return this.obtenerInsumo(insumoId);
  }

  /**
   * HU 3.1 - DESCUENTO OPERATIVO DE STOCK
   *
   * Este método NO lo llama nadie directamente: se ejecuta solo cuando
   * Enfermería publica el evento "medicacion.administrada".
   * { async: true } => se ejecuta en segundo plano, sin frenar al enfermero.
   */
  @OnEvent(EVENTOS.MEDICACION_ADMINISTRADA, { async: true })
  async alAdministrarMedicacion(evento: MedicacionAdministradaEvento): Promise<void> {
    try {
      const descontado = await this.dataSource.transaction(async (manager) => {
        // OPERACIÓN ATÓMICA: se resta y se valida en UNA sola sentencia SQL.
        //   UPDATE insumos SET stock = stock - 1 WHERE id = @id AND stock >= 1
        // Mal: leer el stock (50), restar en el programa (49) y guardar 49.
        // Si dos enfermeros lo hacen a la vez, ambos leen 50 y ambos guardan
        // 49: se pierde un descuento. Con la sentencia atómica eso no pasa.
        const resultado = await manager
          .createQueryBuilder()
          .update(Insumo)
          .set({ stock: () => 'stock - :cantidad' })
          .where('id = :id AND stock >= :cantidad', {
            id: evento.insumoId,
            cantidad: evento.cantidad,
          })
          .execute();

        if (resultado.affected !== 1) return false; // no alcanzaba el stock

        await manager.save(
          manager.create(MovimientoInventario, {
            insumoId: evento.insumoId,
            tipo: 'EGRESO',
            cantidad: evento.cantidad,
            motivo: `Administración de medicación N.º ${evento.administracionId}`,
            eventoId: evento.eventoId,
            usuarioId: evento.enfermeroId,
          }),
        );
        return true;
      });

      if (!descontado) {
        await this.notificaciones.notificar({
          rolDestino: NombreRol.Administrador,
          prioridad: 'ALTA',
          titulo: 'Quiebre de stock',
          mensaje: `Se administró ${evento.insumoNombre} pero no había stock suficiente para descontar.`,
        });
      }
      this.notificaciones.difundirActualizacion('inventario');
    } catch (error) {
      // Un error acá no debe afectar a quien publicó el evento.
      this.logger.error(`No se pudo descontar stock (evento ${evento.eventoId})`, error);
    }
  }
}
