<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { iamService } from '@/modules/iam/services/iam.service';
import { useSesionStore } from '@/modules/iam/stores/sesion';
import EtiquetaEstado from '@/shared/components/EtiquetaEstado.vue';
import MensajeEstado from '@/shared/components/MensajeEstado.vue';
import SelectorPaciente from '@/shared/components/SelectorPaciente.vue';
import { useAccion, useMonitor } from '@/shared/composables/useAccion';
import type { EnListaEspera, Turno, Usuario } from '@/shared/tipos';
import { hora, hoy, nombreCompleto } from '@/shared/utils/formato';
import { admisionService, type AccionTurno } from '../services/admision.service';

const sesion = useSesionStore();
const esMedico = sesion.tieneRol('Médico');
const esAdmision = sesion.tieneRol('Recepcionista', 'Administrador');
const { error, exito, cargando, ejecutar } = useAccion();

// ---------- Filtros ----------
const fecha = ref(hoy());
const medicoId = ref<number | null>(esMedico ? sesion.usuario!.id : null);
const medicos = ref<Usuario[]>([]);

// ---------- Datos ----------
const turnos = ref<Turno[]>([]);
const espera = ref<EnListaEspera[]>([]);

/** Paciente con el que se va a reservar, insertar un entreturno o anotar en espera. */
const pacienteId = ref<number | null>(null);
const agenda = reactive({ horaInicio: '08:00', horaFin: '12:00', duracionMinutos: 30 });
const horaEntreturno = ref('');

async function cargar() {
  if (!medicoId.value) return;
  turnos.value = await admisionService.listarTurnos(fecha.value, medicoId.value);
  if (esAdmision) espera.value = await admisionService.listarEspera(fecha.value, medicoId.value);
}

onMounted(async () => {
  medicos.value = await iamService.listarMedicos();
  if (!medicoId.value) medicoId.value = medicos.value[0]?.id ?? null;
});
// Si cambia la fecha o el médico se vuelve a consultar.
watch([fecha, medicoId], cargar);
// ...y también cuando el backend avisa que cambió algún turno (otro usuario reservó, etc.).
useMonitor('turnos', cargar);

/** Ejecuta una acción y, salga bien o mal, refresca la agenda para ver el estado real. */
async function accionar(accion: () => Promise<unknown>, mensaje: string) {
  await ejecutar(accion, mensaje);
  await cargar();
}

function reservar(turno: Turno) {
  if (!pacienteId.value) {
    error.value = 'Seleccione primero un paciente.';
    return;
  }
  accionar(() => admisionService.reservar(turno.id, pacienteId.value!), 'Turno reservado: quedó Programado.');
}

const MENSAJES: Record<AccionTurno, string> = {
  confirmar: 'Turno confirmado.',
  llegada: 'Llegada registrada: se avisó al médico.',
  atender: 'Turno atendido. Se generó el cargo de la consulta.',
  cancelar: 'Turno cancelado. El horario quedó liberado.',
};
const cambiarEstado = (turno: Turno, accion: AccionTurno) =>
  accionar(() => admisionService.cambiarEstado(turno.id, accion), MENSAJES[accion]);

const generarAgenda = () =>
  accionar(
    () => admisionService.generarAgenda({ medicoId: medicoId.value!, fecha: fecha.value, ...agenda }),
    'Agenda generada.',
  );

function insertarEntreturno() {
  if (!pacienteId.value) {
    error.value = 'Seleccione primero un paciente.';
    return;
  }
  accionar(
    () =>
      admisionService.insertarEntreturno({
        medicoId: medicoId.value!,
        pacienteId: pacienteId.value!,
        // El usuario escribe la hora local; toISOString() la convierte a UTC para enviarla.
        fechaHora: new Date(`${fecha.value}T${horaEntreturno.value}:00`).toISOString(),
      }),
    'Entreturno insertado. Se ajustó la duración del turno afectado.',
  );
}

function agregarAEspera() {
  if (!pacienteId.value) {
    error.value = 'Seleccione primero un paciente.';
    return;
  }
  accionar(
    () =>
      admisionService.agregarAEspera({
        medicoId: medicoId.value!,
        pacienteId: pacienteId.value!,
        fecha: fecha.value,
      }),
    'Paciente agregado a la lista de espera.',
  );
}

/** Hora de fin de un turno, para mostrar "10:00 - 10:15". */
const horaFin = (turno: Turno) =>
  hora(new Date(new Date(turno.fechaHoraInicio).getTime() + turno.duracionMinutos * 60_000).toISOString());
</script>

<template>
  <h1>Turnos y agenda</h1>
  <p class="subtitulo">
    {{ esMedico ? 'Su agenda del día.' : 'Reserva, confirmación, llegada y cancelación de turnos.' }}
  </p>

  <MensajeEstado :error="error" :exito="exito" />

  <section class="tarjeta">
    <div class="formulario en-linea">
      <label>Fecha <input v-model="fecha" type="date" /></label>
      <label v-if="!esMedico">
        Médico
        <select v-model="medicoId">
          <option v-for="medico in medicos" :key="medico.id" :value="medico.id">
            Dr/a. {{ medico.apellido }}, {{ medico.nombre }}
          </option>
        </select>
      </label>
      <SelectorPaciente v-if="esAdmision" v-model="pacienteId" etiqueta="Paciente para operar" />
    </div>
  </section>

  <section class="tarjeta tabla-contenedor">
    <h2>Agenda del día</h2>
    <p v-if="turnos.length === 0" class="vacio">No hay turnos generados para este día.</p>
    <table v-else>
      <thead>
        <tr>
          <th>Horario</th>
          <th>Duración</th>
          <th>Estado</th>
          <th>Paciente</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="turno in turnos" :key="turno.id" :class="{ cancelado: turno.estado === 'Cancelado' }">
          <td>
            <strong>{{ hora(turno.fechaHoraInicio) }}</strong> – {{ horaFin(turno) }}
          </td>
          <td>
            {{ turno.duracionMinutos }} min
            <!-- Etiquetas visuales de la HU 1.2 -->
            <span v-if="turno.esEntreturno" class="etiqueta naranja">Entreturno</span>
            <span v-else-if="turno.tiempoReducido" class="etiqueta amarillo">Tiempo reducido</span>
          </td>
          <td><EtiquetaEstado :texto="turno.estado" /></td>
          <td>{{ nombreCompleto(turno.paciente) }}</td>
          <td>
            <div class="acciones">
              <template v-if="esAdmision">
                <button v-if="turno.estado === 'Disponible'" class="chico" :disabled="cargando" @click="reservar(turno)">
                  Reservar
                </button>
                <button v-if="turno.estado === 'Programado'" class="chico" :disabled="cargando" @click="cambiarEstado(turno, 'confirmar')">
                  Confirmar
                </button>
                <button v-if="turno.estado === 'Confirmado'" class="chico" :disabled="cargando" @click="cambiarEstado(turno, 'llegada')">
                  Registrar llegada
                </button>
                <button
                  v-if="['Programado', 'Confirmado', 'En Sala de Espera'].includes(turno.estado)"
                  class="chico peligro"
                  :disabled="cargando"
                  @click="cambiarEstado(turno, 'cancelar')"
                >
                  Cancelar
                </button>
              </template>
              <button
                v-if="esMedico && turno.estado === 'En Sala de Espera'"
                class="chico"
                :disabled="cargando"
                @click="cambiarEstado(turno, 'atender')"
              >
                Marcar atendido
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <div v-if="esAdmision" class="grilla">
    <section class="tarjeta">
      <h2>Lista de espera del día</h2>
      <p class="subtitulo">Si se cancela un turno, se asigna solo al primero de esta lista.</p>
      <ol v-if="espera.length > 0">
        <li v-for="item in espera" :key="item.id">{{ nombreCompleto(item.paciente) }}</li>
      </ol>
      <p v-else class="vacio">No hay pacientes en espera.</p>
      <button class="secundario" :disabled="cargando" @click="agregarAEspera">
        Agregar al paciente seleccionado
      </button>
    </section>

    <section class="tarjeta">
      <h2>Insertar entreturno</h2>
      <p class="subtitulo">Divide un turno existente para atender una urgencia menor.</p>
      <form class="formulario" @submit.prevent="insertarEntreturno">
        <label>Hora del entreturno <input v-model="horaEntreturno" type="time" required /></label>
        <button type="submit" class="secundario" :disabled="cargando">
          Insertar para el paciente seleccionado
        </button>
      </form>
    </section>

    <section class="tarjeta">
      <h2>Generar agenda</h2>
      <p class="subtitulo">Crea los turnos disponibles del médico para la fecha elegida.</p>
      <form class="formulario" @submit.prevent="generarAgenda">
        <label>Desde <input v-model="agenda.horaInicio" type="time" required /></label>
        <label>Hasta <input v-model="agenda.horaFin" type="time" required /></label>
        <label>
          Duración de cada turno (minutos)
          <input v-model.number="agenda.duracionMinutos" type="number" min="5" max="120" step="5" required />
        </label>
        <button type="submit" class="secundario" :disabled="cargando">Generar</button>
      </form>
    </section>
  </div>
</template>

<style scoped>
tr.cancelado td {
  color: var(--texto-suave);
  text-decoration: line-through;
}
tr.cancelado td:nth-child(3) {
  text-decoration: none;
}
td .etiqueta {
  margin-left: 6px;
}
</style>
