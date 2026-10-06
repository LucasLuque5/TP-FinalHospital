import { onMounted, onUnmounted, ref } from 'vue';
import { mensajeDeError } from '@/shared/services/httpClient';
import { useNotificacionesStore } from '@/shared/stores/notificaciones';
import type { Monitor } from '@/shared/tipos';

/**
 * COMPOSABLE: lógica reutilizable entre componentes.
 *
 * Todas las pantallas hacen lo mismo al llamar al backend: marcar que
 * están "cargando", y al terminar mostrar un mensaje de éxito o de error.
 * En vez de repetir ese try/catch en cada pantalla, se escribe una vez acá.
 *
 * Uso:
 *   const { error, exito, cargando, ejecutar } = useAccion();
 *   ejecutar(() => servicio.guardar(datos), 'Guardado correctamente');
 */
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

/**
 * Carga los datos al abrir la pantalla y los vuelve a cargar cada vez que
 * el backend avisa que ese monitor cambió (actualización en tiempo real).
 */
export function useMonitor(monitor: Monitor, recargar: () => void) {
  const notificaciones = useNotificacionesStore();
  let darDeBaja: (() => void) | null = null;

  onMounted(() => {
    recargar();
    darDeBaja = notificaciones.suscribir(monitor, recargar);
  });
  onUnmounted(() => darDeBaja?.());
}
