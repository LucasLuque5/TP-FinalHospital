import {
  BadRequestException,
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
import { aFechaLocal } from '../shared/utilidades.js';
import {
  AgregarListaEsperaDto,
  GenerarAgendaDto,
  InsertarEntreturnoDto,
  RegistrarTriajeDto,
  ReservarTurnoDto,
} from './dto/admision.dto.js';
import { TriajeService } from './triaje.service.js';
import { TurnosService } from './turnos.service.js';

const { Administrador, Recepcionista, Medico, Enfermero, Paciente } = NombreRol;

@Controller('admision')
export class AdmisionController {
  constructor(
    private readonly turnos: TurnosService,
    private readonly triaje: TriajeService,
  ) {}

  // ---------- Agenda y turnos ----------

  @Roles(Administrador, Recepcionista, Medico)
  @Get('turnos')
  listarTurnos(@Query('fecha') fecha?: string, @Query('medicoId') medicoId?: string) {
    return this.turnos.listar(this.fechaODefecto(fecha), medicoId ? Number(medicoId) : undefined);
  }

  @Roles(Paciente)
  @Get('mis-turnos')
  misTurnos(@Usuario() usuario: UsuarioActual) {
    return this.turnos.listarDePaciente(usuario.pacienteId!);
  }

  @Roles(Administrador, Recepcionista)
  @Post('agenda')
  generarAgenda(@Body() dto: GenerarAgendaDto) {
    return this.turnos.generarAgenda(dto);
  }

  @Roles(Recepcionista, Administrador)
  @Post('turnos/:id/reservar')
  @HttpCode(200)
  reservar(@Param('id', ParseIntPipe) id: number, @Body() dto: ReservarTurnoDto) {
    return this.turnos.reservar(id, dto.pacienteId);
  }

  @Roles(Recepcionista, Administrador, Paciente)
  @Post('turnos/:id/confirmar')
  @HttpCode(200)
  confirmar(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.turnos.cambiarEstado(id, 'confirmar', usuario);
  }

  @Roles(Recepcionista, Administrador)
  @Post('turnos/:id/llegada')
  @HttpCode(200)
  registrarLlegada(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.turnos.cambiarEstado(id, 'llegada', usuario);
  }

  @Roles(Medico)
  @Post('turnos/:id/atender')
  @HttpCode(200)
  atender(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.turnos.cambiarEstado(id, 'atender', usuario);
  }

  @Roles(Recepcionista, Administrador, Paciente)
  @Post('turnos/:id/cancelar')
  @HttpCode(200)
  cancelar(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.turnos.cambiarEstado(id, 'cancelar', usuario);
  }

  /** HU 1.2: el "usuario con privilegios" es Recepción o Administración. */
  @Roles(Recepcionista, Administrador)
  @Post('entreturnos')
  insertarEntreturno(@Body() dto: InsertarEntreturnoDto) {
    return this.turnos.insertarEntreturno(dto);
  }

  // ---------- Lista de espera ----------

  @Roles(Recepcionista, Administrador)
  @Get('lista-espera')
  listarEspera(@Query('fecha') fecha?: string, @Query('medicoId') medicoId?: string) {
    return this.turnos.listarEspera(this.fechaODefecto(fecha), medicoId ? Number(medicoId) : undefined);
  }

  @Roles(Recepcionista, Administrador)
  @Post('lista-espera')
  agregarAListaEspera(@Body() dto: AgregarListaEsperaDto) {
    return this.turnos.agregarAListaEspera(dto);
  }

  // ---------- Guardia (triaje) ----------

  @Roles(Enfermero, Medico)
  @Get('guardia')
  colaDeGuardia() {
    return this.triaje.obtenerCola();
  }

  @Roles(Enfermero)
  @Post('guardia')
  registrarTriaje(@Body() dto: RegistrarTriajeDto, @Usuario() enfermero: UsuarioActual) {
    return this.triaje.registrar(dto, enfermero);
  }

  @Roles(Medico)
  @Post('guardia/:id/atender')
  @HttpCode(200)
  atenderGuardia(@Param('id', ParseIntPipe) id: number) {
    return this.triaje.marcarAtendido(id);
  }

  /** Si no llega ?fecha=AAAA-MM-DD se usa el día de hoy. */
  private fechaODefecto(fecha?: string): string {
    if (!fecha) return aFechaLocal(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new BadRequestException('La fecha debe tener formato AAAA-MM-DD.');
    }
    return fecha;
  }
}
