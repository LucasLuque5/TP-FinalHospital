import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, Subject, filter, map } from 'rxjs';
import { Repository } from 'typeorm';
import { EVENTOS } from '../eventos.js';
import type { UsuarioActual } from '../../iam/usuario-actual.js';
import { Notificacion } from './notificacion.entity.js';

export type Monitor = 'camas' | 'turnos' | 'guardia' | 'protocolos' | 'inventario';

interface MensajeEnVivo {
  tipo: 'notificacion' | 'actualizacion';
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
  private readonly canal = new Subject<MensajeEnVivo>();

  constructor(
    @InjectRepository(Notificacion)
    private readonly notificaciones: Repository<Notificacion>,
  ) {}

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

  difundirActualizacion(monitor: Monitor): void {
    this.canal.next({ tipo: 'actualizacion', datos: { monitor } });
  }

  @OnEvent(EVENTOS.CAMA_ESTADO_CAMBIADO)
  alCambiarEstadoDeCama(): void {
    this.difundirActualizacion('camas');
  }

  listarPara(usuario: UsuarioActual): Promise<Notificacion[]> {
    return this.notificaciones
      .createQueryBuilder('n')
      .where('n.rolDestino = :rol', { rol: usuario.rol })
      .andWhere('(n.usuarioDestinoId IS NULL OR n.usuarioDestinoId = :id)', { id: usuario.id })
      .orderBy('n.id', 'DESC')
      .take(30)
      .getMany();
  }

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
