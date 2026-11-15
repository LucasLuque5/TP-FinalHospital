import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UsuarioActual } from '../usuario-actual.js';

export const Usuario = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): UsuarioActual =>
    contexto.switchToHttp().getRequest().usuario,
);
