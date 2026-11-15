import { ref } from 'vue';
import { defineStore } from 'pinia';
import httpClient from '@/shared/services/httpClient';
import { conectarEnVivo } from '@/shared/services/enVivo';
import type { Monitor, Notificacion } from '@/shared/tipos';

export const useNotificacionesStore = defineStore('notificaciones', () => {
  const lista = ref<Notificacion[]>([]);
  const sinLeer = ref(0);
  const alertaDestacada = ref<Notificacion | null>(null);

  const suscriptores = new Map<Monitor, Set<() => void>>();
  let desconectar: (() => void) | null = null;

  async function iniciar() {
    if (desconectar) return;
    lista.value = (await httpClient.get<Notificacion[]>('/notificaciones')).data;

    desconectar = conectarEnVivo((mensaje) => {
      if (mensaje.tipo === 'notificacion') {
        const nueva = mensaje.datos as Notificacion;
        lista.value.unshift(nueva);
        sinLeer.value++;
        if (nueva.prioridad === 'ALTA') alertaDestacada.value = nueva;
      } else {
        const monitor = mensaje.datos.monitor as Monitor;
        suscriptores.get(monitor)?.forEach((recargar) => recargar());
      }
    });
  }

  function detener() {
    desconectar?.();
    desconectar = null;
    lista.value = [];
    sinLeer.value = 0;
    alertaDestacada.value = null;
  }

  function suscribir(monitor: Monitor, recargar: () => void): () => void {
    if (!suscriptores.has(monitor)) suscriptores.set(monitor, new Set());
    suscriptores.get(monitor)!.add(recargar);
    return () => suscriptores.get(monitor)?.delete(recargar);
  }

  return { lista, sinLeer, alertaDestacada, iniciar, detener, suscribir };
});
