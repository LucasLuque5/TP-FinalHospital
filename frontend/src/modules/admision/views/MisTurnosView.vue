<script setup lang="ts">
import { onMounted, ref } from 'vue';
import EtiquetaEstado from '@/shared/components/EtiquetaEstado.vue';
import MensajeEstado from '@/shared/components/MensajeEstado.vue';
import { useAccion } from '@/shared/composables/useAccion';
import type { Turno } from '@/shared/tipos';
import { fechaHora } from '@/shared/utils/formato';
import { admisionService } from '../services/admision.service';

/** Pantalla del rol Paciente: ve sus turnos y puede confirmar o cancelar. */
const { error, exito, cargando, ejecutar } = useAccion();
const turnos = ref<Turno[]>([]);

async function cargar() {
  turnos.value = await admisionService.misTurnos();
}
onMounted(() => ejecutar(cargar));

async function accionar(turno: Turno, accion: 'confirmar' | 'cancelar') {
  await ejecutar(
    () => admisionService.cambiarEstado(turno.id, accion),
    accion === 'confirmar' ? 'Asistencia confirmada.' : 'Turno cancelado.',
  );
  await cargar();
}
</script>

<template>
  <h1>Mis turnos</h1>
  <p class="subtitulo">Confirme su asistencia o cancele el turno si no puede concurrir.</p>

  <MensajeEstado :error="error" :exito="exito" />

  <section class="tarjeta tabla-contenedor">
    <p v-if="turnos.length === 0" class="vacio">No tiene turnos registrados.</p>
    <table v-else>
      <thead>
        <tr>
          <th>Fecha y hora</th>
          <th>Profesional</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="turno in turnos" :key="turno.id">
          <td>{{ fechaHora(turno.fechaHoraInicio) }}</td>
          <td>Dr/a. {{ turno.medico.apellido }}</td>
          <td><EtiquetaEstado :texto="turno.estado" /></td>
          <td>
            <div class="acciones">
              <button v-if="turno.estado === 'Programado'" class="chico" :disabled="cargando" @click="accionar(turno, 'confirmar')">
                Confirmar asistencia
              </button>
              <button
                v-if="['Programado', 'Confirmado'].includes(turno.estado)"
                class="chico peligro"
                :disabled="cargando"
                @click="accionar(turno, 'cancelar')"
              >
                Cancelar
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
