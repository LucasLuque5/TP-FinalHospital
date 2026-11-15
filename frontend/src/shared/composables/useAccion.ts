import { onMounted, onUnmounted, ref } from 'vue';
import { mensajeDeError } from '@/shared/services/httpClient';
import { useNotificacionesStore } from '@/shared/stores/notificaciones';
import type { Monitor } from '@/shared/tipos';

export function useAccion() {
  const error = ref('');
  const exito = ref('');
  const cargando = ref(false);

  async function ejecutar<T>(accion: () => Promise<T>, mensajeExito = ''): Promise<T | undefined> {
    error.value = '';
    exito.value = '';
    cargando.value = true;
    try {
      const resultado = await accion();
      exito.value = mensajeExito;
      return resultado;
    } catch (e) {
      error.value = mensajeDeError(e);
      return undefined;
    } finally {
      cargando.value = false;
    }
  }

  return { error, exito, cargando, ejecutar };
}

export function useMonitor(monitor: Monitor, recargar: () => void) {
  const notificaciones = useNotificacionesStore();
  let darDeBaja: (() => void) | null = null;

  onMounted(() => {
    recargar();
    darDeBaja = notificaciones.suscribir(monitor, recargar);
  });
  onUnmounted(() => darDeBaja?.());
}
