import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UsuarioActual } from '../usuario-actual.js';

/**
 * Permite recibir en un método del controlador al usuario que hizo la petición:
 *   reservar(@Usuario() usuario: UsuarioActual) { ... }
 * El AuthGuard es quien lo guarda en la petición después de validar el token.
 */
export const Usuario = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): UsuarioActual =>
    contexto.switchToHttp().getRequest().usuario,
);
