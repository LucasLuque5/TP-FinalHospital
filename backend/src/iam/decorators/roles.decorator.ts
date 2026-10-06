import { SetMetadata } from '@nestjs/common';
import type { NombreRol } from '../usuario-actual.js';

export const ROLES_PERMITIDOS = 'rolesPermitidos';

/**
 * Indica qué roles pueden usar una ruta. Ejemplo:
 *   @Roles(NombreRol.Recepcionista, NombreRol.Administrador)
 * Si una ruta no lleva @Roles, alcanza con haber iniciado sesión.
 */
export const Roles = (...roles: NombreRol[]) => SetMetadata(ROLES_PERMITIDOS, roles);
