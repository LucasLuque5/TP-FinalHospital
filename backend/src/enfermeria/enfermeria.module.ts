import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecursosModule } from '../recursos/recursos.module.js';
import { NotificacionesModule } from '../shared/notificaciones/notificaciones.module.js';
import { EnfermeriaController } from './enfermeria.controller.js';
import { EnfermeriaService } from './enfermeria.service.js';
import {
  AdministracionMedicacion,
  IndicacionMedica,
  NotaEnfermeria,
  Protocolo,
  ProtocoloTarea,
  SignoVital,
} from './entities/enfermeria.entities.js';
import { ProtocolosService } from './protocolos.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SignoVital,
      NotaEnfermeria,
      IndicacionMedica,
      AdministracionMedicacion,
      Protocolo,
      ProtocoloTarea,
    ]),
    RecursosModule, // para consultar internaciones e insumos
    NotificacionesModule,
  ],
  controllers: [EnfermeriaController],
  providers: [EnfermeriaService, ProtocolosService],
})
export class EnfermeriaModule {}
