<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useSesionStore } from '@/modules/iam/stores/sesion';
import { recursosService } from '@/modules/recursos/services/recursos.service';
import MensajeEstado from '@/shared/components/MensajeEstado.vue';
import { useAccion } from '@/shared/composables/useAccion';
import type { Internacion, NotaEnfermeria, SignoVital } from '@/shared/tipos';
import { fechaHora, nombreCompleto } from '@/shared/utils/formato';
import { enfermeriaService } from '../services/enfermeria.service';

const sesion = useSesionStore();
const esEnfermero = sesion.tieneRol('Enfermero');
const { error, exito, cargando, ejecutar } = useAccion();

const internaciones = ref<Internacion[]>([]);
const internacionId = ref<number | null>(null);
const signos = ref<SignoVital[]>([]);
const notas = ref<NotaEnfermeria[]>([]);

const valores = reactive({
  presionSistolica: null as number | null,
  presionDiastolica: null as number | null,
  frecuenciaCardiaca: null as number | null,
  temperatura: null as number | null,
});
const textoNota = ref('');

const pacienteElegido = () =>
  internaciones.value.find((internacion) => internacion.id === internacionId.value)?.pacienteId;

async function cargar() {
  const pacienteId = pacienteElegido();
  signos.value = await enfermeriaService.listarSignos(pacienteId);
  notas.value = pacienteId ? await enfermeriaService.listarNotas(pacienteId) : [];
}

onMounted(async () => {
  internaciones.value = await recursosService.internacionesActivas();
  await cargar();
});
watch(internacionId, cargar);

async function registrar() {
  const registro = await ejecutar(() =>
    enfermeriaService.registrarSignos({
      internacionId: internacionId.value!,
      presionSistolica: valores.presionSistolica!,
      presionDiastolica: valores.presionDiastolica!,
      frecuenciaCardiaca: valores.frecuenciaCardiaca!,
      temperatura: valores.temperatura!,
    }),
  );
  if (!registro) return;

  if (registro.fueraDeRango) {
    // Los valores anormales se informan como error (en rojo) para que no pasen inadvertidos.
    error.value = 'Registro guardado con valores FUERA DE RANGO. Se notificó al médico de guardia.';
  } else {
    exito.value = 'Registro guardado. Controles dentro de los rangos normales.';
  }
  Object.assign(valores, {
    presionSistolica: null,
    presionDiastolica: null,
    frecuenciaCardiaca: null,
    temperatura: null,
  });
  await cargar();
}

async function agregarNota() {
  await ejecutar(() => enfermeriaService.crearNota(pacienteElegido()!, textoNota.value), 'Nota agregada.');
  if (!error.value) textoNota.value = '';
  await cargar();
}
</script>

<template>
  <h1>Signos vitales</h1>
  <p class="subtitulo">Control de pacientes internados. Los registros fuera de rango se destacan en rojo.</p>

  <MensajeEstado :error="error" :exito="exito" />

  <section class="tarjeta">
    <form class="formulario en-linea" @submit.prevent="registrar">
      <label>
        Paciente internado
        <select v-model="internacionId" required>
          <option :value="null">Todos los pacientes…</option>
          <option v-for="internacion in internaciones" :key="internacion.id" :value="internacion.id">
            {{ nombreCompleto(internacion.paciente) }} — Hab. {{ internacion.cama.habitacion.numero }} (cama
            {{ internacion.cama.codigo }})
          </option>
        </select>
      </label>
      <template v-if="esEnfermero">
        <label>
          Presión sistólica (mmHg)
          <input v-model.number="valores.presionSistolica" type="number" min="30" max="300" required />
        </label>
        <label>
          Presión diastólica (mmHg)
          <input v-model.number="valores.presionDiastolica" type="number" min="20" max="200" required />
        </label>
        <label>
          Frecuencia cardíaca (lpm)
          <input v-model.number="valores.frecuenciaCardiaca" type="number" min="20" max="250" required />
        </label>
        <label>
          Temperatura (°C)
          <input v-model.number="valores.temperatura" type="number" min="30" max="45" step="0.1" required />
        </label>
        <button type="submit" :disabled="cargando || !internacionId">Registrar control</button>
      </template>
    </form>
  </section>

  <section class="tarjeta tabla-contenedor">
    <h2>Últimos controles</h2>
    <p v-if="signos.length === 0" class="vacio">Sin controles registrados.</p>
    <table v-else>
      <thead>
        <tr>
          <th>Fecha y hora</th>
          <th>Paciente</th>
          <th>Presión arterial</th>
          <th>Frec. cardíaca</th>
          <th>Temperatura</th>
          <th>Registró</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in signos" :key="item.id" :class="{ 'fila-alerta': item.fueraDeRango }">
          <td>{{ fechaHora(item.registradoEn) }}</td>
          <td>{{ nombreCompleto(item.paciente) }}</td>
          <td>{{ item.presionSistolica }}/{{ item.presionDiastolica }} mmHg</td>
          <td>{{ item.frecuenciaCardiaca }} lpm</td>
          <td>{{ item.temperatura }} °C</td>
          <td>{{ item.enfermero.apellido }}</td>
          <td>{{ item.fueraDeRango ? 'Fuera de rango' : '' }}</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section v-if="internacionId" class="tarjeta">
    <h2>Notas de enfermería del paciente</h2>
    <form v-if="esEnfermero" class="formulario" @submit.prevent="agregarNota">
      <label>
        Nueva nota
        <textarea v-model.trim="textoNota" rows="2" required maxlength="500"></textarea>
      </label>
      <div><button type="submit" class="secundario" :disabled="cargando">Agregar nota</button></div>
    </form>
    <p v-if="notas.length === 0" class="vacio">Sin notas.</p>
    <article v-for="nota in notas" :key="nota.id" class="nota">
      <small>
        {{ fechaHora(nota.creadoEn) }} · {{ nota.enfermero.apellido }}
        <span v-if="nota.automatica" class="etiqueta">Automática</span>
      </small>
      <p>{{ nota.texto }}</p>
    </article>
  </section>
</template>

<style scoped>
.nota {
  border-top: 1px solid var(--borde);
  padding-top: 8px;
  margin-top: 8px;
}
.nota p {
  margin: 4px 0 0;
}
small {
  color: var(--texto-suave);
}
</style>
