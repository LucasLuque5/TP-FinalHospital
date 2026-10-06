import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_PERMITIDOS } from '../decorators/roles.decorator.js';
import type { NombreRol, UsuarioActual } from '../usuario-actual.js';

/**
 * AUTORIZACIÓN (RBAC): responde la pregunta "¿tenés permiso para esto?".
 * Compara el rol del usuario con los roles que la ruta declara en @Roles().
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const rolesPermitidos = this.reflector.getAllAndOverride<NombreRol[] | undefined>(
      ROLES_PERMITIDOS,
      [contexto.getHandler(), contexto.getClass()],
    );
    // Sin @Roles: cualquier usuario autenticado puede pasar.
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
