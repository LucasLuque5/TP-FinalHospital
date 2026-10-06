import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HceModule } from '../hce/hce.module.js';
import { IamModule } from '../iam/iam.module.js';
import { NotificacionesModule } from '../shared/notificaciones/notificaciones.module.js';
import { AdmisionController } from './admision.controller.js';
import { ListaEspera } from './entities/lista-espera.entity.js';
import { Triaje } from './entities/triaje.entity.js';
import { Turno } from './entities/turno.entity.js';
import { TriajeService } from './triaje.service.js';
import { TurnosService } from './turnos.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Turno, ListaEspera, Triaje]),
    // Componentes de los que depende Admisión:
    HceModule, // para validar pacientes
    IamModule, // para validar médicos
    NotificacionesModule, // para alertar a recepción y a los médicos
  ],
  controllers: [AdmisionController],
  providers: [TurnosService, TriajeService],
})
export class AdmisionModule {}
