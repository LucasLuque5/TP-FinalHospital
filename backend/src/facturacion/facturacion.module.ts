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

/**
 * Notar que Facturación NO importa a Admisión, Enfermería ni Recursos:
 * se entera de lo que pasa en ellos únicamente a través de eventos.
 */
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
