<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useSesionStore } from '@/modules/iam/stores/sesion';
import { recursosService } from '@/modules/recursos/services/recursos.service';
import EtiquetaEstado from '@/shared/components/EtiquetaEstado.vue';
import MensajeEstado from '@/shared/components/MensajeEstado.vue';
import { useAccion } from '@/shared/composables/useAccion';
import type { Dosis, Insumo, Internacion } from '@/shared/tipos';
import { ahoraLocal, fechaHora, nombreCompleto } from '@/shared/utils/formato';
import { enfermeriaService } from '../services/enfermeria.service';

const sesion = useSesionStore();
const esMedico = sesion.tieneRol('Médico');
const { error, exito, cargando, ejecutar } = useAccion();

const dosis = ref<Dosis[]>([]);
const internaciones = ref<Internacion[]>([]);
const insumos = ref<Insumo[]>([]);

const indicacion = reactive({
  pacienteId: null as number | null,
  insumoId: null as number | null,
  descripcion: '',
  frecuenciaHoras: 8,
  primeraDosis: ahoraLocal(),
  cantidadDosis: 3,
});

async function cargar() {
  dosis.value = await enfermeriaService.listarMedicacion();
}

onMounted(async () => {
  await ejecutar(cargar);
  if (esMedico) {
    [internaciones.value, insumos.value] = await Promise.all([
      recursosService.internacionesActivas(),
      recursosService.listarInsumos(),
    ]);
  }
});

async function administrar(item: Dosis) {
  await ejecutar(
    () => enfermeriaService.administrar(item.id),
    'Dosis administrada. Se descontó el insumo del stock y se cargó a la cuenta del paciente.',
  );
  await cargar();
}

async function prescribir() {
  await ejecutar(
    () =>
      enfermeriaService.crearIndicacion({
        pacienteId: indicacion.pacienteId!,
        insumoId: indicacion.insumoId!,
        descripcion: indicacion.descripcion,
        frecuenciaHoras: indicacion.frecuenciaHoras,
        primeraDosis: new Date(indicacion.primeraDosis).toISOString(),
        cantidadDosis: indicacion.cantidadDosis,
      }),
    'Indicación creada. Se programaron las dosis.',
  );
  if (!error.value) indicacion.descripcion = '';
  await cargar();
}
</script>

<template>
  <h1>Medicación</h1>
  <p class="subtitulo">
    Dosis prescritas por el médico tratante. Solo pueden administrarse dentro de los 30 minutos anteriores o
    posteriores a la hora programada.
  </p>

  <MensajeEstado :error="error" :exito="exito" />

  <section v-if="esMedico" class="tarjeta">
    <h2>Nueva indicación médica</h2>
    <form class="formulario en-linea" @submit.prevent="prescribir">
      <label>
        Paciente internado
        <select v-model="indicacion.pacienteId" required>
          <option :value="null" disabled>Seleccione…</option>
          <option v-for="internacion in internaciones" :key="internacion.id" :value="internacion.pacienteId">
            {{ nombreCompleto(internacion.paciente) }} (cama {{ internacion.cama.codigo }})
          </option>
        </select>
      </label>
      <label>
        Insumo
        <select v-model="indicacion.insumoId" required>
          <option :value="null" disabled>Seleccione…</option>
          <option v-for="insumo in insumos" :key="insumo.id" :value="insumo.id">{{ insumo.nombre }}</option>
        </select>
      </label>
      <label>
        Indicación
        <input v-model.trim="indicacion.descripcion" required placeholder="Ej.: Ibuprofeno 400mg cada 8 horas" />
      </label>
      <label>
        Cada (horas)
        <input v-model.number="indicacion.frecuenciaHoras" type="number" min="1" max="48" required />
      </label>
      <label>Primera dosis <input v-model="indicacion.primeraDosis" type="datetime-local" required /></label>
      <label>
        Cantidad de dosis
        <input v-model.number="indicacion.cantidadDosis" type="number" min="1" max="30" required />
      </label>
      <button type="submit" :disabled="cargando">Prescribir</button>
    </form>
  </section>

  <section class="tarjeta tabla-contenedor">
    <h2>Dosis programadas</h2>
    <p v-if="dosis.length === 0" class="vacio">No hay indicaciones activas.</p>
    <table v-else>
      <thead>
        <tr>
          <th>Hora programada</th>
          <th>Paciente</th>
          <th>Indicación</th>
          <th>Estado</th>
          <th>Administró</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in dosis" :key="item.id">
          <td>{{ fechaHora(item.horaProgramada) }}</td>
          <td>{{ nombreCompleto(item.indicacion.paciente) }}</td>
          <td>{{ item.indicacion.descripcion }}</td>
          <td><EtiquetaEstado :texto="item.estado" /></td>
          <td>
            <template v-if="item.enfermero">
              {{ nombreCompleto(item.enfermero) }}<br />
              <small>{{ fechaHora(item.administradaEn) }}</small>
            </template>
            <template v-else>-</template>
          </td>
          <td>
            <button
              v-if="item.estado === 'Pendiente' && sesion.tieneRol('Enfermero')"
              class="chico"
              :disabled="cargando"
              @click="administrar(item)"
            >
              Marcar administrada
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
small {
  color: var(--texto-suave);
}
</style>
