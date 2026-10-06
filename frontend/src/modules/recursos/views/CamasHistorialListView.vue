<script setup lang="ts">
import { ref } from 'vue';
import { useMonitor } from '@/shared/composables/useAccion';
import type { Internacion } from '@/shared/tipos';
import { fechaHora, nombreCompleto } from '@/shared/utils/formato';
import { recursosService } from '../services/recursos.service';

const MOTIVOS: Record<string, string> = {
  PRE_QUIRURGICO: 'Cirugía programada',
  INFECCION_RESPIRATORIA: 'Infección respiratoria',
  OTRO: 'Otro',
};

const historial = ref<Internacion[]>([]);
useMonitor('camas', async () => {
  historial.value = await recursosService.historialDeCamas();
});
</script>

<template>
  <h1>Historial de camas</h1>
  <p class="subtitulo">Qué paciente ocupó cada cama, con su marca temporal de ingreso y de egreso.</p>

  <section class="tarjeta tabla-contenedor">
    <p v-if="historial.length === 0" class="vacio">Todavía no hay internaciones.</p>
    <table v-else>
      <thead>
        <tr>
          <th>Cama</th>
          <th>Paciente</th>
          <th>Motivo de ingreso</th>
          <th>Diagnóstico inicial</th>
          <th>Ingreso</th>
          <th>Egreso</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in historial" :key="item.id">
          <td><strong>{{ item.cama.codigo }}</strong> (hab. {{ item.cama.habitacion.numero }})</td>
          <td>{{ nombreCompleto(item.paciente) }}</td>
          <td>{{ MOTIVOS[item.motivoIngreso] }}</td>
          <td>{{ item.diagnosticoInicial ?? '-' }}</td>
          <td>{{ fechaHora(item.fechaIngreso) }}</td>
          <td>
            <span v-if="item.fechaEgreso">{{ fechaHora(item.fechaEgreso) }}</span>
            <span v-else class="etiqueta azul">Internado</span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
