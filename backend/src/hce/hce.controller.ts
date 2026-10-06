import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Roles } from '../iam/decorators/roles.decorator.js';
import { Usuario } from '../iam/decorators/usuario.decorator.js';
import { NombreRol, type UsuarioActual } from '../iam/usuario-actual.js';
import {
  ActualizarPacienteDto,
  CrearAlergiaDto,
  CrearAntecedenteDto,
  CrearEvolucionDto,
  CrearPacienteDto,
} from './dto/hce.dto.js';
import { HceService } from './hce.service.js';

const PERSONAL = [
  NombreRol.Administrador,
  NombreRol.Recepcionista,
  NombreRol.Medico,
  NombreRol.Enfermero,
];

@Controller('hce')
export class HceController {
  constructor(private readonly servicio: HceService) {}

  @Roles(...PERSONAL)
  @Get('pacientes')
  listarPacientes(@Query('buscar') buscar?: string) {
    return this.servicio.listarPacientes(buscar);
  }

  /** Registro de pacientes: lo hace la recepción (responsabilidad de Admisión). */
  @Roles(NombreRol.Recepcionista, NombreRol.Administrador)
  @Post('pacientes')
  registrarPaciente(@Body() dto: CrearPacienteDto) {
    return this.servicio.registrarPaciente(dto);
  }

  @Roles(NombreRol.Recepcionista, NombreRol.Administrador)
  @Patch('pacientes/:id')
  actualizarPaciente(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarPacienteDto) {
    return this.servicio.actualizarPaciente(id, dto);
  }

  /** La información clínica solo la ve el personal de salud. */
  @Roles(NombreRol.Medico, NombreRol.Enfermero)
  @Get('pacientes/:id/historia')
  obtenerHistoria(@Param('id', ParseIntPipe) id: number) {
    return this.servicio.obtenerHistoria(id);
  }

  @Roles(NombreRol.Medico, NombreRol.Enfermero)
  @Post('pacientes/:id/alergias')
  registrarAlergia(@Param('id', ParseIntPipe) id: number, @Body() dto: CrearAlergiaDto) {
    return this.servicio.registrarAlergia(id, dto);
  }

  @Roles(NombreRol.Medico)
  @Post('pacientes/:id/antecedentes')
  registrarAntecedente(@Param('id', ParseIntPipe) id: number, @Body() dto: CrearAntecedenteDto) {
    return this.servicio.registrarAntecedente(id, dto);
  }

  @Roles(NombreRol.Medico)
  @Post('pacientes/:id/evoluciones')
  registrarEvolucion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearEvolucionDto,
    @Usuario() medico: UsuarioActual,
  ) {
    return this.servicio.registrarEvolucion(id, dto, medico);
  }
}
