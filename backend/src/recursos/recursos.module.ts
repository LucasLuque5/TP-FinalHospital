import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HceModule } from '../hce/hce.module.js';
import { NotificacionesModule } from '../shared/notificaciones/notificaciones.module.js';
import { Cama, Habitacion, Internacion } from './entities/camas.entities.js';
import { Insumo, MovimientoInventario } from './entities/inventario.entities.js';
import { InventarioService } from './inventario.service.js';
import { RecursosController } from './recursos.controller.js';
import { RecursosService } from './recursos.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Habitacion, Cama, Internacion, Insumo, MovimientoInventario]),
    HceModule,
    NotificacionesModule,
  ],
  controllers: [RecursosController],
  providers: [RecursosService, InventarioService],
  exports: [RecursosService, InventarioService],
})
export class RecursosModule {}
