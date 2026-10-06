import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, Subject, filter, map } from 'rxjs';
import { Repository } from 'typeorm';
import { EVENTOS } from '../eventos.js';
import type { UsuarioActual } from '../../iam/usuario-actual.js';
import { Notificacion } from './notificacion.entity.js';

/** Pantallas que se pueden refrescar solas cuando algo cambia. */
export type Monitor = 'camas' | 'turnos' | 'guardia' | 'protocolos' | 'inventario';

/** Mensaje que viaja por el canal en tiempo real hacia los navegadores. */
interface MensajeEnVivo {
  tipo: 'notificacion' | 'actualizacion';
  /** Para "notificacion": a quién va dirigida. */
  rolDestino?: string;
  usuarioDestinoId?: number | null;
  datos: unknown;
}

export interface NuevaNotificacion {
  rolDestino: string;
  usuarioDestinoId?: number;
  prioridad: 'NORMAL' | 'ALTA';
  titulo: string;
  mensaje: string;
}

@Injectable()
export class NotificacionesService {
  /**
   * Un Subject de RxJS es un "canal": todo lo que se publica con next()
   * les llega a quienes estén suscriptos (los navegadores conectados).
   */
  private readonly canal = new Subject<MensajeEnVivo>();

  constructor(
    @InjectRepository(Notificacion)
    private readonly notificaciones: Repository<Notificacion>,
  ) {}

  /** Guarda la notificación en la base y la envía en vivo a los destinatarios. */
  async notificar(nueva: NuevaNotificacion): Promise<void> {
    const guardada = await this.notificaciones.save(
      this.notificaciones.create({
        ...nueva,
        usuarioDestinoId: nueva.usuarioDestinoId ?? null,
      }),
    );
    this.canal.next({
      tipo: 'notificacion',
      rolDestino: guardada.rolDestino,
      usuarioDestinoId: guardada.usuarioDestinoId,
      datos: guardada,
    });
  }

  /** Avisa a todas las pantallas abiertas que deben recargar un monitor. */
  difundirActualizacion(monitor: Monitor): void {
    this.canal.next({ tipo: 'actualizacion', datos: { monitor } });
  }

  /** Recursos publica este evento; acá se reenvía a los monitores (HU 2.1 de Recursos). */
  @OnEvent(EVENTOS.CAMA_ESTADO_CAMBIADO)
  alCambiarEstadoDeCama(): void {
    this.difundirActualizacion('camas');
  }

  /** Últimas notificaciones que le corresponden al usuario. */
  listarPara(usuario: UsuarioActual): Promise<Notificacion[]> {
    return this.notificaciones
      .createQueryBuilder('n')
      .where('n.rolDestino = :rol', { rol: usuario.rol })
      .andWhere('(n.usuarioDestinoId IS NULL OR n.usuarioDestinoId = :id)', { id: usuario.id })
      .orderBy('n.id', 'DESC')
      .take(30)
      .getMany();
  }

  /** Flujo en vivo (Server-Sent Events) filtrado para un usuario. */
  flujoPara(usuario: UsuarioActual): Observable<{ data: unknown }> {
    return this.canal.pipe(
      filter(
        (mensaje) =>
          mensaje.tipo === 'actualizacion' ||
          (mensaje.rolDestino === usuario.rol &&
            (!mensaje.usuarioDestinoId || mensaje.usuarioDestinoId === usuario.id)),
      ),
      map((mensaje) => ({ data: { tipo: mensaje.tipo, datos: mensaje.datos } })),
    );
  }
}
