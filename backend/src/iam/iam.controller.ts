import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Publico } from './decorators/publico.decorator.js';
import { Roles } from './decorators/roles.decorator.js';
import { Usuario } from './decorators/usuario.decorator.js';
import { ActualizarUsuarioDto, CrearUsuarioDto, LoginDto } from './dto/iam.dto.js';
import { IamService } from './iam.service.js';
import { NombreRol, type UsuarioActual } from './usuario-actual.js';

@Controller('iam')
export class IamController {
  constructor(private readonly servicio: IamService) {}

  @Publico()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.servicio.login(dto);
  }

  /** Devuelve los datos del usuario dueño del token. */
  @Get('perfil')
  perfil(@Usuario() usuario: UsuarioActual) {
    return usuario;
  }

  @Roles(NombreRol.Administrador, NombreRol.Recepcionista, NombreRol.Medico, NombreRol.Enfermero)
  @Get('medicos')
  listarMedicos() {
    return this.servicio.listarMedicos();
  }

  @Roles(NombreRol.Administrador)
  @Get('roles')
  listarRoles() {
    return this.servicio.listarRoles();
  }

  @Roles(NombreRol.Administrador)
  @Get('usuarios')
  listarUsuarios() {
    return this.servicio.listarUsuarios();
  }

  @Roles(NombreRol.Administrador)
  @Post('usuarios')
  crearUsuario(@Body() dto: CrearUsuarioDto) {
    return this.servicio.crearUsuario(dto);
  }

  @Roles(NombreRol.Administrador)
  @Patch('usuarios/:id')
  actualizarUsuario(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarUsuarioDto) {
    return this.servicio.actualizarUsuario(id, dto);
  }
}
