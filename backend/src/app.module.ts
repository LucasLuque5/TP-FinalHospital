import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configurarBaseDeDatos } from './config/base-datos.config.js';
import { IamModule } from './iam/iam.module.js';
import { HceModule } from './hce/hce.module.js';
import { AdmisionModule } from './admision/admision.module.js';
import { EnfermeriaModule } from './enfermeria/enfermeria.module.js';
import { RecursosModule } from './recursos/recursos.module.js';
import { FacturacionModule } from './facturacion/facturacion.module.js';
import { NotificacionesModule } from './shared/notificaciones/notificaciones.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ inject: [ConfigService], useFactory: configurarBaseDeDatos }),
    EventEmitterModule.forRoot(),
    NotificacionesModule,

    IamModule,
    HceModule,
    AdmisionModule,
    EnfermeriaModule,
    RecursosModule,
    FacturacionModule,
  ],
})
export class AppModule {}
