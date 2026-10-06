<script setup lang="ts">
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSesionStore } from '@/modules/iam/stores/sesion';
import BarraLateral from '@/shared/components/BarraLateral.vue';
import PanelNotificaciones from '@/shared/components/PanelNotificaciones.vue';
import { useNotificacionesStore } from '@/shared/stores/notificaciones';

/**
 * Componente raíz. Decide qué "marco" mostrar:
 *  - sin sesión (login): solo la pantalla;
 *  - con sesión: menú lateral + notificaciones + la pantalla elegida.
 * <RouterView /> es el hueco donde vue-router dibuja la pantalla actual.
 */
const ruta = useRoute();
const sesion = useSesionStore();
const notificaciones = useNotificacionesStore();

// Cuando alguien inicia sesión se abre el canal de notificaciones en vivo.
// El rol Paciente no recibe alertas del hospital.
watch(
  () => sesion.usuario,
  (usuario) => {
    if (usuario && usuario.rol !== 'Paciente') notificaciones.iniciar();
  },
  { immediate: true },
);
</script>

<template>
  <RouterView v-if="ruta.meta.publica" />

  <div v-else class="aplicacion">
    <BarraLateral />
    <main class="contenido">
      <PanelNotificaciones v-if="sesion.usuario?.rol !== 'Paciente'" />
      <RouterView />
    </main>
  </div>
</template>
