import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NombreRol, type UsuarioActual } from '../iam/usuario-actual.js';
import { EVENTOS, type MedicacionAdministradaEvento } from '../shared/eventos.js';
import { NotificacionesService } from '../shared/notificaciones/notificaciones.service.js';
import type { IngresoStockDto } from './dto/recursos.dto.js';
import { Insumo, MovimientoInventario } from './entities/inventario.entities.js';

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

  async obtenerInsumo(id: number): Promise<Insumo> {
    const insumo = await this.insumos.findOneBy({ id });
    if (!insumo) throw new NotFoundException(`No existe el insumo ${id}.`);
    return insumo;
  }

  async registrarIngreso(insumoId: number, dto: IngresoStockDto, usuario: UsuarioActual) {
    await this.obtenerInsumo(insumoId);
    await this.dataSource.transaction(async (manager) => {
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

  @OnEvent(EVENTOS.MEDICACION_ADMINISTRADA, { async: true })
  async alAdministrarMedicacion(evento: MedicacionAdministradaEvento): Promise<void> {
    try {
      const descontado = await this.dataSource.transaction(async (manager) => {
        const resultado = await manager
          .createQueryBuilder()
          .update(Insumo)
          .set({ stock: () => 'stock - :cantidad' })
          .where('id = :id AND stock >= :cantidad', {
            id: evento.insumoId,
            cantidad: evento.cantidad,
          })
          .execute();

        if (resultado.affected !== 1) return false;

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
      this.logger.error(`No se pudo descontar stock (evento ${evento.eventoId})`, error);
    }
  }
}
