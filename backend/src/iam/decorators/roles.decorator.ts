import { SetMetadata } from '@nestjs/common';
import type { NombreRol } from '../usuario-actual.js';

export const ROLES_PERMITIDOS = 'rolesPermitidos';

export const Roles = (...roles: NombreRol[]) => SetMetadata(ROLES_PERMITIDOS, roles);
