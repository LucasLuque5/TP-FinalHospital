import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ES_PUBLICO } from '../decorators/publico.decorator.js';
import type { UsuarioActual } from '../usuario-actual.js';

/**
 * AUTENTICACIÓN: responde la pregunta "¿quién sos?".
 * Se ejecuta antes de cada petición y verifica el token JWT que viene en
 * la cabecera  Authorization: Bearer <token>.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const esPublico = this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (esPublico) return true;

    const peticion = contexto.switchToHttp().getRequest();
    const [tipo, token] = (peticion.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Debe iniciar sesión.');
    }

    try {
      // verifyAsync comprueba la firma y que el token no esté vencido.
      const datos = await this.jwt.verifyAsync<UsuarioActual>(token);
      peticion.usuario = {
        id: datos.id,
        nombreUsuario: datos.nombreUsuario,
        nombreCompleto: datos.nombreCompleto,
        rol: datos.rol,
        pacienteId: datos.pacienteId,
      } satisfies UsuarioActual;
      return true;
    } catch {
      throw new UnauthorizedException('La sesión no es válida o ya venció.');
    }
  }
}
