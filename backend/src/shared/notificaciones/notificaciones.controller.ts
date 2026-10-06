import { Controller, Get, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Usuario } from '../../iam/decorators/usuario.decorator.js';
import type { UsuarioActual } from '../../iam/usuario-actual.js';
import { NotificacionesService } from './notificaciones.service.js';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly servicio: NotificacionesService) {}

  @Get()
  listar(@Usuario() usuario: UsuarioActual) {
    return this.servicio.listarPara(usuario);
  }

  /**
   * Server-Sent Events: el navegador deja la conexión abierta y el servidor
   * le va enviando mensajes a medida que ocurren (alertas y refrescos).
   */
  @Sse('en-vivo')
  enVivo(@Usuario() usuario: UsuarioActual): Observable<{ data: unknown }> {
    return this.servicio.flujoPara(usuario);
  }
}
