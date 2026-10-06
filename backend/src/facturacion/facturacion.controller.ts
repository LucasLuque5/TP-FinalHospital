import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { Roles } from '../iam/decorators/roles.decorator.js';
import { NombreRol } from '../iam/usuario-actual.js';
import { AsignarCoberturaDto, FacturarPrestacionDto } from './dto/facturacion.dto.js';
import { FacturacionService } from './facturacion.service.js';

const { Administrador, Recepcionista } = NombreRol;

/** El "analista de facturación" de las historias se asignó al rol Administrador. */
@Controller('facturacion')
export class FacturacionController {
  constructor(private readonly servicio: FacturacionService) {}

  @Roles(Administrador, Recepcionista)
  @Get('obras-sociales')
  listarObrasSociales() {
    return this.servicio.listarObrasSociales();
  }

  @Roles(Administrador, Recepcionista)
  @Get('coberturas-pacientes')
  listarCoberturas() {
    return this.servicio.listarCoberturas();
  }

  @Roles(Administrador, Recepcionista)
  @Post('coberturas-pacientes')
  asignarCobertura(@Body() dto: AsignarCoberturaDto) {
    return this.servicio.asignarCobertura(dto);
  }

  @Roles(Administrador, Recepcionista)
  @Get('coberturas-pacientes/validar/:pacienteId')
  validarCobertura(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.servicio.validarCobertura(pacienteId);
  }

  @Roles(Administrador)
  @Get('prestaciones')
  listarPrestaciones() {
    return this.servicio.listarPrestaciones();
  }

  /** Orden manual de facturar una prestación (HU 1.1). */
  @Roles(Administrador)
  @Post('facturas')
  facturarPrestacion(@Body() dto: FacturarPrestacionDto) {
    return this.servicio.facturarPrestacion(dto.pacienteId, dto.prestacionId);
  }

  @Roles(Administrador)
  @Get('facturas')
  listarFacturas() {
    return this.servicio.listarFacturas();
  }

  @Roles(Administrador)
  @Get('facturas/:id')
  obtenerFactura(@Param('id', ParseIntPipe) id: number) {
    return this.servicio.obtenerFactura(id);
  }

  @Roles(Administrador)
  @Get('facturas-items')
  listarItems() {
    return this.servicio.listarItems();
  }

  @Roles(Administrador)
  @Get('reportes/resumen')
  resumen() {
    return this.servicio.obtenerResumen();
  }
}
