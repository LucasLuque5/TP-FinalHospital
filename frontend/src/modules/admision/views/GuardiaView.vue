<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useSesionStore } from '@/modules/iam/stores/sesion';
import EtiquetaEstado from '@/shared/components/EtiquetaEstado.vue';
import MensajeEstado from '@/shared/components/MensajeEstado.vue';
import SelectorPaciente from '@/shared/components/SelectorPaciente.vue';
import { useAccion, useMonitor } from '@/shared/composables/useAccion';
import type { EnGuardia } from '@/shared/tipos';
import { hora, nombreCompleto } from '@/shared/utils/formato';
import { admisionService } from '../services/admision.service';

const sesion = useSesionStore();
const { error, exito, cargando, ejecutar } = useAccion();

const NIVELES = [
  { nivel: 1, texto: '1 - Rojo: Riesgo Vital' },
  { nivel: 2, texto: '2 - Naranja: Emergencia' },
  { nivel: 3, texto: '3 - Amarillo: Urgencia' },
  { nivel: 4, texto: '4 - Verde: Urgencia menor' },
  { nivel: 5, texto: '5 - Azul: No urgente' },
];

const cola = ref<EnGuardia[]>([]);
const nuevo = reactive({ pacienteId: null as number | null, nivel: 3, motivo: '' });

async function cargar() {
  cola.value = await admisionService.colaDeGuardia();
}
// La cola se actualiza sola cuando otro usuario registra o atiende un paciente.
useMonitor('guardia', cargar);

async function registrar() {
  if (!nuevo.pacienteId) {
    error.value = 'Seleccione un paciente.';
    return;
  }
  const ingresado = await ejecutar(() =>
    admisionService.registrarTriaje({ pacienteId: nuevo.pacienteId!, nivel: nuevo.nivel, motivo: nuevo.motivo }),
  );
  if (ingresado) {
    exito.value = `Paciente ingresado en la posición ${ingresado.posicion} de la cola.`;
    Object.assign(nuevo, { pacienteId: null, nivel: 3, motivo: '' });
  }
  await cargar();
}

async function atender(item: EnGuardia) {
  await ejecutar(() => admisionService.atenderGuardia(item.id), 'Paciente llamado a atención.');
  await cargar();
}
</script>

<template>
  <h1>Guardia</h1>
  <p class="subtitulo">Cola de espera ordenada por nivel de urgencia y, a igual nivel, por orden de llegada.</p>

  <MensajeEstado :error="error" :exito="exito" />

  <section v-if="sesion.tieneRol('Enfermero')" class="tarjeta">
    <h2>Ingreso y clasificación (triaje)</h2>
    <form class="formulario en-linea" @submit.prevent="registrar">
      <SelectorPaciente v-model="nuevo.pacienteId" />
      <label>
        Nivel de urgencia
        <select v-model.number="nuevo.nivel">
          <option v-for="opcion in NIVELES" :key="opcion.nivel" :value="opcion.nivel">{{ opcion.texto }}</option>
        </select>
      </label>
      <label>Motivo de consulta <input v-model.trim="nuevo.motivo" required maxlength="300" /></label>
      <button type="submit" :disabled="cargando">Ingresar a la cola</button>
    </form>
  </section>

  <section class="tarjeta tabla-contenedor">
    <h2>Cola de espera</h2>
    <p v-if="cola.length === 0" class="vacio">No hay pacientes esperando en guardia.</p>
    <table v-else>
      <thead>
        <tr>
          <th>#</th>
          <th>Clasificación</th>
          <th>Paciente</th>
          <th>Motivo</th>
          <th>Ingreso</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in cola" :key="item.id" :class="{ 'fila-alerta': item.nivel === 1 }">
          <td>{{ item.posicion }}</td>
          <td><EtiquetaEstado :texto="item.color" /> {{ item.nivelNombre }}</td>
          <td>{{ nombreCompleto(item.paciente) }}</td>
          <td>{{ item.motivo }}</td>
          <td>{{ hora(item.ingresoEn) }}</td>
          <td>
            <button v-if="sesion.tieneRol('Médico')" class="chico" :disabled="cargando" @click="atender(item)">
              Atender
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
