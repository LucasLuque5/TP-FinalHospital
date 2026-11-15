import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_PERMITIDOS } from '../decorators/roles.decorator.js';
import type { NombreRol, UsuarioActual } from '../usuario-actual.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const rolesPermitidos = this.reflector.getAllAndOverride<NombreRol[] | undefined>(
      ROLES_PERMITIDOS,
      [contexto.getHandler(), contexto.getClass()],
    );
    if (!rolesPermitidos || rolesPermitidos.length === 0) return true;

    const usuario: UsuarioActual | undefined = contexto.switchToHttp().getRequest().usuario;
    if (!usuario || !rolesPermitidos.includes(usuario.rol)) {
      throw new ForbiddenException(
        `Su rol (${usuario?.rol ?? 'sin rol'}) no tiene permiso para realizar esta acción.`,
      );
    }
    return true;
  }
}
