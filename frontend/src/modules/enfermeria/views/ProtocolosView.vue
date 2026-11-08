<script setup lang="ts">
import { ref } from 'vue';
import { useSesionStore } from '@/modules/iam/stores/sesion';
import MensajeEstado from '@/shared/components/MensajeEstado.vue';
import TarjetaSeccion from '@/shared/components/TarjetaSeccion.vue';
import { useAccion, useMonitor } from '@/shared/composables/useAccion';
import type { Protocolo } from '@/shared/tipos';
import { fechaHora, nombreCompleto } from '@/shared/utils/formato';
import { enfermeriaService } from '../services/enfermeria.service';

const sesion = useSesionStore();
const { error, exito, cargando, ejecutar } = useAccion();
const protocolos = ref<Protocolo[]>([]);

async function cargar() {
  protocolos.value = await enfermeriaService.listarProtocolos();
}
// Cuando se interna un paciente, su protocolo aparece acá sin recargar la página.
useMonitor('protocolos', cargar);

/** Cantidad de tareas ya realizadas de un protocolo. */
const realizadas = (protocolo: Protocolo) => protocolo.tareas.filter((tarea) => tarea.completada).length;

async function completar(tareaId: number) {
  await ejecutar(() => enfermeriaService.completarTarea(tareaId), 'Tarea marcada como realizada.');
  await cargar();
}
</script>

<template>
  <h1>Protocolos de atención</h1>
  <p class="subtitulo">
    Plan de cuidados que el sistema genera automáticamente cuando un paciente es internado, según su motivo de
    ingreso.
  </p>

  <MensajeEstado :error="error" :exito="exito" />

  <p v-if="protocolos.length === 0" class="tarjeta vacio">
    No hay protocolos activos. Se generan al asignar una cama con motivo "Cirugía programada" o "Infección
    respiratoria".
  </p>

  <div class="grilla">
    <TarjetaSeccion
      v-for="protocolo in protocolos"
      :key="protocolo.id"
      :titulo="protocolo.nombre"
      :descripcion="`${nombreCompleto(protocolo.paciente)} · generado el ${fechaHora(protocolo.creadoEn)}`"
    >
      <template #encabezado>
        <span class="etiqueta" :class="realizadas(protocolo) === protocolo.tareas.length ? 'verde' : 'amarillo'">
          {{ realizadas(protocolo) }}/{{ protocolo.tareas.length }}
        </span>
      </template>
      <ul>
        <li v-for="tarea in protocolo.tareas" :key="tarea.id" :class="{ hecha: tarea.completada }">
          <span>{{ tarea.orden }}. {{ tarea.descripcion }}</span>
          <span v-if="tarea.completada" class="etiqueta verde">Realizada</span>
          <button
            v-else-if="sesion.tieneRol('Enfermero')"
            class="chico secundario"
            :disabled="cargando"
            @click="completar(tarea.id)"
          >
            Marcar realizada
          </button>
          <span v-else class="etiqueta amarillo">Pendiente</span>
        </li>
      </ul>
    </TarjetaSeccion>
  </div>
</template>

<style scoped>
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-top: 1px solid var(--borde);
}
li.hecha span:first-child {
  color: var(--texto-suave);
  text-decoration: line-through;
}
</style>
