import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HceModule } from '../hce/hce.module.js';
import {
  CoberturaPaciente,
  Factura,
  FacturaItem,
  ObraSocial,
  PrecioInsumo,
  Prestacion,
} from './entities/facturacion.entities.js';
import { FacturacionController } from './facturacion.controller.js';
import { FacturacionService } from './facturacion.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ObraSocial,
      CoberturaPaciente,
      Prestacion,
      PrecioInsumo,
      Factura,
      FacturaItem,
    ]),
    HceModule,
  ],
  controllers: [FacturacionController],
  providers: [FacturacionService],
})
export class FacturacionModule {}
