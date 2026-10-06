import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Alergia,
  AntecedenteFamiliar,
  Estudio,
  EvolucionMedica,
} from './entities/historia.entities.js';
import { Paciente } from './entities/paciente.entity.js';
import { HceController } from './hce.controller.js';
import { HceService } from './hce.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Paciente, Alergia, AntecedenteFamiliar, EvolucionMedica, Estudio]),
  ],
  controllers: [HceController],
  providers: [HceService],
  // Lo que se exporta es la "interfaz pública" del componente:
  // los demás módulos solo pueden usar HceService.
  exports: [HceService],
})
export class HceModule {}
