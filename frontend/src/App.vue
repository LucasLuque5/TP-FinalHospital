<script setup lang="ts">
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSesionStore } from '@/modules/iam/stores/sesion';
import BarraLateral from '@/shared/components/BarraLateral.vue';
import PanelNotificaciones from '@/shared/components/PanelNotificaciones.vue';
import { useNotificacionesStore } from '@/shared/stores/notificaciones';

const ruta = useRoute();
const sesion = useSesionStore();
const notificaciones = useNotificacionesStore();

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
