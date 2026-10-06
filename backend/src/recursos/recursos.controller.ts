import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { Roles } from '../iam/decorators/roles.decorator.js';
import { Usuario } from '../iam/decorators/usuario.decorator.js';
import { NombreRol, type UsuarioActual } from '../iam/usuario-actual.js';
import { AsignarCamaDto, IngresoStockDto } from './dto/recursos.dto.js';
import { InventarioService } from './inventario.service.js';
import { AccionCama } from './maquina-estados-cama.js';
import { RecursosService } from './recursos.service.js';

const { Administrador, Recepcionista, Medico, Enfermero } = NombreRol;

/*
 * Las historias nombran actores que no figuran entre los 5 roles del diseño.
 * Se los asignó así:
 *   "administrativo de piso"   -> Recepcionista / Administrador
 *   "personal de maestranza"   -> Recepcionista / Enfermero / Administrador
 *   "gestor de inventario"     -> Administrador
 */
@Controller('recursos')
export class RecursosController {
  constructor(
    private readonly recursos: RecursosService,
    private readonly inventario: InventarioService,
  ) {}

  // ---------- Camas ----------

  @Roles(Administrador, Recepcionista, Medico, Enfermero)
  @Get('camas')
  mapaDeCamas() {
    return this.recursos.obtenerMapaDeCamas();
  }

  @Roles(Recepcionista, Administrador)
  @Post('camas/:id/asignar')
  asignarCama(@Param('id', ParseIntPipe) id: number, @Body() dto: AsignarCamaDto) {
    return this.recursos.asignarCama(id, dto);
  }

  @Roles(Recepcionista, Enfermero, Administrador)
  @Post('camas/:id/confirmar-limpieza')
  @HttpCode(200)
  confirmarLimpieza(@Param('id', ParseIntPipe) id: number) {
    return this.recursos.aplicarAccion(id, AccionCama.ConfirmarLimpieza);
  }

  @Roles(Administrador)
  @Post('camas/:id/bloquear')
  @HttpCode(200)
  bloquear(@Param('id', ParseIntPipe) id: number) {
    return this.recursos.aplicarAccion(id, AccionCama.Bloquear);
  }

  @Roles(Administrador)
  @Post('camas/:id/desbloquear')
  @HttpCode(200)
  desbloquear(@Param('id', ParseIntPipe) id: number) {
    return this.recursos.aplicarAccion(id, AccionCama.Desbloquear);
  }

  // ---------- Internaciones ----------

  @Roles(Administrador, Recepcionista, Medico, Enfermero)
  @Get('internaciones')
  internacionesActivas() {
    return this.recursos.listarInternacionesActivas();
  }

  @Roles(Medico)
  @Post('internaciones/:id/alta')
  @HttpCode(200)
  darDeAlta(@Param('id', ParseIntPipe) id: number) {
    return this.recursos.darDeAlta(id);
  }

  @Roles(Administrador, Recepcionista)
  @Get('camas-historial')
  historial() {
    return this.recursos.listarHistorial();
  }

  // ---------- Inventario ----------

  @Roles(Administrador, Enfermero, Medico)
  @Get('insumos')
  listarInsumos() {
    return this.inventario.listarInsumos();
  }

  @Roles(Administrador)
  @Post('insumos/:id/ingresos')
  registrarIngreso(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: IngresoStockDto,
    @Usuario() usuario: UsuarioActual,
  ) {
    return this.inventario.registrarIngreso(id, dto, usuario);
  }

  @Roles(Administrador)
  @Get('movimientos-inventarios')
  listarMovimientos() {
    return this.inventario.listarMovimientos();
  }
}
