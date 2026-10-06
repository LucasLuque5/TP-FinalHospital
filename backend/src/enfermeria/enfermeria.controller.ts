import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../iam/decorators/roles.decorator.js';
import { Usuario } from '../iam/decorators/usuario.decorator.js';
import { NombreRol, type UsuarioActual } from '../iam/usuario-actual.js';
import {
  CrearIndicacionDto,
  CrearNotaDto,
  RegistrarSignosVitalesDto,
} from './dto/enfermeria.dto.js';
import { EnfermeriaService } from './enfermeria.service.js';
import { ProtocolosService } from './protocolos.service.js';

const { Medico, Enfermero } = NombreRol;

@Controller('enfermeria')
export class EnfermeriaController {
  constructor(
    private readonly enfermeria: EnfermeriaService,
    private readonly protocolos: ProtocolosService,
  ) {}

  // ---------- Signos vitales ----------

  @Roles(Enfermero, Medico)
  @Get('signos-vitales')
  listarSignos(@Query('pacienteId', new ParseIntPipe({ optional: true })) pacienteId?: number) {
    return this.enfermeria.listarSignos(pacienteId);
  }

  @Roles(Enfermero)
  @Post('signos-vitales')
  registrarSignos(@Body() dto: RegistrarSignosVitalesDto, @Usuario() enfermero: UsuarioActual) {
    return this.enfermeria.registrarSignos(dto, enfermero);
  }

  // ---------- Notas de enfermería ----------

  @Roles(Enfermero, Medico)
  @Get('notas')
  listarNotas(@Query('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.enfermeria.listarNotas(pacienteId);
  }

  @Roles(Enfermero)
  @Post('notas')
  crearNota(@Body() dto: CrearNotaDto, @Usuario() enfermero: UsuarioActual) {
    return this.enfermeria.crearNota(dto, enfermero);
  }

  // ---------- Medicación ----------

  @Roles(Medico)
  @Post('indicaciones')
  crearIndicacion(@Body() dto: CrearIndicacionDto, @Usuario() medico: UsuarioActual) {
    return this.enfermeria.crearIndicacion(dto, medico);
  }

  @Roles(Enfermero, Medico)
  @Get('medicacion')
  listarMedicacion() {
    return this.enfermeria.listarAdministraciones();
  }

  @Roles(Enfermero)
  @Post('medicacion/:id/administrar')
  @HttpCode(200)
  administrar(@Param('id', ParseIntPipe) id: number, @Usuario() enfermero: UsuarioActual) {
    return this.enfermeria.administrar(id, enfermero);
  }

  // ---------- Protocolos de atención ----------

  @Roles(Enfermero, Medico)
  @Get('protocolos')
  listarProtocolos() {
    return this.protocolos.listarActivos();
  }

  @Roles(Enfermero)
  @Post('protocolos/tareas/:id/completar')
  @HttpCode(200)
  completarTarea(@Param('id', ParseIntPipe) id: number, @Usuario() enfermero: UsuarioActual) {
    return this.protocolos.completarTarea(id, enfermero);
  }
}
