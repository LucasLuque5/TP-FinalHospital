<script setup lang="ts">
import { computed, ref } from 'vue';
import EtiquetaEstado from '@/shared/components/EtiquetaEstado.vue';
import { useMonitor } from '@/shared/composables/useAccion';
import type { Cama, Habitacion } from '@/shared/tipos';
import { recursosService } from '../services/recursos.service';

const camas = ref<Cama[]>([]);
useMonitor('camas', async () => {
  camas.value = await recursosService.mapaDeCamas();
});

/** Agrupa las camas por habitación para mostrar una fila por cada una. */
const habitaciones = computed(() => {
  const grupos = new Map<number, { habitacion: Habitacion; camas: Cama[] }>();
  for (const cama of camas.value) {
    if (!grupos.has(cama.habitacion.id)) {
      grupos.set(cama.habitacion.id, { habitacion: cama.habitacion, camas: [] });
    }
    grupos.get(cama.habitacion.id)!.camas.push(cama);
  }
  return [...grupos.values()].sort((a, b) => a.habitacion.numero.localeCompare(b.habitacion.numero));
});
</script>

<template>
  <h1>Habitaciones</h1>
  <p class="subtitulo">Habitaciones del hospital y estado de las camas de cada una.</p>

  <section class="tarjeta tabla-contenedor">
    <table>
      <thead>
        <tr>
          <th>Habitación</th>
          <th>Piso</th>
          <th>Sector</th>
          <th>Camas</th>
          <th>Libres</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="grupo in habitaciones" :key="grupo.habitacion.id">
          <td><strong>{{ grupo.habitacion.numero }}</strong></td>
          <td>{{ grupo.habitacion.piso }}</td>
          <td>{{ grupo.habitacion.sector }}</td>
          <td>
            <span v-for="cama in grupo.camas" :key="cama.id" class="cama">
              {{ cama.codigo }} <EtiquetaEstado :texto="cama.estado" />
            </span>
          </td>
          <td>{{ grupo.camas.filter((cama) => cama.estado === 'Libre').length }} de {{ grupo.camas.length }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.cama {
  display: inline-block;
  margin-right: 14px;
}
</style>
