<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { enfermeriaService } from '@/modules/enfermeria/services/enfermeria.service';
import { useSesionStore } from '@/modules/iam/stores/sesion';
import EtiquetaEstado from '@/shared/components/EtiquetaEstado.vue';
import MensajeEstado from '@/shared/components/MensajeEstado.vue';
import { useAccion } from '@/shared/composables/useAccion';
import type { HistoriaClinica, NotaEnfermeria, SignoVital } from '@/shared/tipos';
import { fecha, fechaHora } from '@/shared/utils/formato';
import { hceService } from '../services/hce.service';

// El ID del paciente viene en la dirección: /hce/pacientes/:id/historia
const pacienteId = Number(useRoute().params.id);
const sesion = useSesionStore();
const { error, exito, cargando, ejecutar } = useAccion();

const historia = ref<HistoriaClinica | null>(null);
const signos = ref<SignoVital[]>([]);
const notas = ref<NotaEnfermeria[]>([]);

const alergia = reactive({ sustancia: '', severidad: 'Leve', observaciones: '' });
const antecedente = reactive({ parentesco: '', enfermedad: '' });
const evolucion = ref('');

async function cargar() {
  // Las tres consultas se hacen en paralelo.
  [historia.value, signos.value, notas.value] = await Promise.all([
    hceService.obtenerHistoria(pacienteId),
    enfermeriaService.listarSignos(pacienteId),
    enfermeriaService.listarNotas(pacienteId),
  ]);
}
onMounted(() => ejecutar(cargar));

async function guardar(accion: () => Promise<void>, mensaje: string, limpiar: () => void) {
  await ejecutar(accion, mensaje);
  if (error.value) return; // si falló, se deja el formulario como estaba
  limpiar();
  await cargar();
}

const agregarAlergia = () =>
  guardar(
    () =>
      hceService.registrarAlergia(pacienteId, {
        sustancia: alergia.sustancia,
        severidad: alergia.severidad,
        observaciones: alergia.observaciones || undefined,
      }),
    'Alergia registrada.',
    () => Object.assign(alergia, { sustancia: '', severidad: 'Leve', observaciones: '' }),
  );

const agregarAntecedente = () =>
  guardar(
    () => hceService.registrarAntecedente(pacienteId, { ...antecedente }),
    'Antecedente registrado.',
    () => Object.assign(antecedente, { parentesco: '', enfermedad: '' }),
  );

const agregarEvolucion = () =>
  guardar(
    () => hceService.registrarEvolucion(pacienteId, evolucion.value),
    'Evolución registrada.',
    () => (evolucion.value = ''),
  );
</script>

<template>
  <RouterLink to="/hce/pacientes">← Volver a pacientes</RouterLink>
  <MensajeEstado :error="error" :exito="exito" />

  <template v-if="historia">
    <h1>{{ historia.paciente.apellido }}, {{ historia.paciente.nombre }}</h1>
    <p class="subtitulo">
      DNI {{ historia.paciente.dni }} · Nacimiento {{ fecha(historia.paciente.fechaNacimiento) }} ·
      Tel. {{ historia.paciente.telefono ?? '-' }} · {{ historia.paciente.direccion ?? 'Sin dirección' }}
    </p>

    <div class="grilla">
      <section class="tarjeta">
        <h2>Alergias</h2>
        <p v-if="historia.alergias.length === 0" class="vacio">Sin alergias registradas.</p>
        <ul>
          <li v-for="item in historia.alergias" :key="item.id">
            <strong>{{ item.sustancia }}</strong>
            <span class="etiqueta" :class="item.severidad === 'Grave' ? 'rojo' : 'amarillo'">
              {{ item.severidad }}
            </span>
            <div v-if="item.observaciones">{{ item.observaciones }}</div>
          </li>
        </ul>
        <form class="formulario" @submit.prevent="agregarAlergia">
          <label>Sustancia <input v-model.trim="alergia.sustancia" required /></label>
          <label>
            Severidad
            <select v-model="alergia.severidad">
              <option>Leve</option>
              <option>Moderada</option>
              <option>Grave</option>
            </select>
          </label>
          <label>Observaciones <input v-model.trim="alergia.observaciones" /></label>
          <button type="submit" class="secundario" :disabled="cargando">Agregar alergia</button>
        </form>
      </section>

      <section class="tarjeta">
        <h2>Antecedentes familiares</h2>
        <p v-if="historia.antecedentes.length === 0" class="vacio">Sin antecedentes registrados.</p>
        <ul>
          <li v-for="item in historia.antecedentes" :key="item.id">
            <strong>{{ item.parentesco }}:</strong> {{ item.enfermedad }}
            <div v-if="item.observaciones">{{ item.observaciones }}</div>
          </li>
        </ul>
        <form v-if="sesion.tieneRol('Médico')" class="formulario" @submit.prevent="agregarAntecedente">
          <label>Parentesco <input v-model.trim="antecedente.parentesco" required /></label>
          <label>Enfermedad <input v-model.trim="antecedente.enfermedad" required /></label>
          <button type="submit" class="secundario" :disabled="cargando">Agregar antecedente</button>
        </form>
      </section>
    </div>

    <section class="tarjeta">
      <h2>Evoluciones médicas</h2>
      <p class="subtitulo">Las evoluciones no se pueden modificar ni borrar una vez guardadas.</p>
      <form v-if="sesion.tieneRol('Médico')" class="formulario" @submit.prevent="agregarEvolucion">
        <label>
          Nueva evolución
          <textarea v-model.trim="evolucion" rows="3" required></textarea>
        </label>
        <div><button type="submit" :disabled="cargando">Guardar evolución</button></div>
      </form>
      <p v-if="historia.evoluciones.length === 0" class="vacio">Sin evoluciones.</p>
      <article v-for="item in historia.evoluciones" :key="item.id" class="evolucion">
        <small>{{ fechaHora(item.registradoEn) }} · Dr/a. {{ item.medico.apellido }}</small>
        <p>{{ item.descripcion }}</p>
      </article>
    </section>

    <section class="tarjeta">
      <h2>Estudios</h2>
      <p v-if="historia.estudios.length === 0" class="vacio">Sin estudios cargados.</p>
      <details v-for="item in historia.estudios" :key="item.id">
        <summary>{{ fecha(item.fecha) }} · {{ item.tipo }}</summary>
        <p>{{ item.informe }}</p>
      </details>
    </section>

    <div class="grilla">
      <section class="tarjeta tabla-contenedor">
        <h2>Signos vitales registrados</h2>
        <p v-if="signos.length === 0" class="vacio">Sin controles.</p>
        <table v-else>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Presión</th>
              <th>FC</th>
              <th>Temp.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in signos" :key="item.id" :class="{ 'fila-alerta': item.fueraDeRango }">
              <td>{{ fechaHora(item.registradoEn) }}</td>
              <td>{{ item.presionSistolica }}/{{ item.presionDiastolica }}</td>
              <td>{{ item.frecuenciaCardiaca }}</td>
              <td>{{ item.temperatura }} °C</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="tarjeta">
        <h2>Notas de enfermería</h2>
        <p v-if="notas.length === 0" class="vacio">Sin notas.</p>
        <article v-for="nota in notas" :key="nota.id" class="evolucion">
          <small>
            {{ fechaHora(nota.creadoEn) }} · {{ nota.enfermero.apellido }}
            <EtiquetaEstado v-if="nota.automatica" texto="Automática" />
          </small>
          <p>{{ nota.texto }}</p>
        </article>
      </section>
    </div>
  </template>
</template>

<style scoped>
ul {
  padding-left: 18px;
  margin-top: 0;
}
li {
  margin-bottom: 6px;
}
li .etiqueta {
  margin-left: 6px;
}
.evolucion {
  border-top: 1px solid var(--borde);
  padding-top: 10px;
  margin-top: 10px;
}
.evolucion p {
  margin: 4px 0 0;
  white-space: pre-line;
}
small {
  color: var(--texto-suave);
}
details {
  border-top: 1px solid var(--borde);
  padding: 8px 0;
}
summary {
  cursor: pointer;
  font-weight: 600;
}
</style>
