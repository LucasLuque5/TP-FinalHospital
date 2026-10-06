<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useSesionStore } from '@/modules/iam/stores/sesion';
import EtiquetaEstado from '@/shared/components/EtiquetaEstado.vue';
import MensajeEstado from '@/shared/components/MensajeEstado.vue';
import SelectorPaciente from '@/shared/components/SelectorPaciente.vue';
import { useAccion, useMonitor } from '@/shared/composables/useAccion';
import type { Cama } from '@/shared/tipos';
import { fechaHora, nombreCompleto } from '@/shared/utils/formato';
import { recursosService, type AccionCama } from '../services/recursos.service';

const sesion = useSesionStore();
const puedeAsignar = sesion.tieneRol('Recepcionista', 'Administrador');
const { error, exito, cargando, ejecutar } = useAccion();

const camas = ref<Cama[]>([]);
/** Cama sobre la que se abrió el formulario de asignación (null = ninguna). */
const camaElegida = ref<Cama | null>(null);
const ingreso = reactive({
  pacienteId: null as number | null,
  motivoIngreso: 'OTRO',
  diagnosticoInicial: '',
});

async function cargar() {
  camas.value = await recursosService.mapaDeCamas();
}
// MONITOR EN TIEMPO REAL: cuando cualquier usuario cambia el estado de una
// cama, el backend publica un evento y este mapa se recarga solo.
useMonitor('camas', cargar);

async function accionar(accion: () => Promise<unknown>, mensaje: string) {
  await ejecutar(accion, mensaje);
  await cargar();
}

async function asignar() {
  if (!camaElegida.value || !ingreso.pacienteId) {
    error.value = 'Seleccione un paciente.';
    return;
  }
  const cama = camaElegida.value;
  await accionar(
    () =>
      recursosService.asignarCama(cama.id, {
        pacienteId: ingreso.pacienteId!,
        motivoIngreso: ingreso.motivoIngreso,
        diagnosticoInicial: ingreso.diagnosticoInicial || undefined,
      }),
    `Paciente asignado a la cama ${cama.codigo}.`,
  );
  if (!error.value) {
    camaElegida.value = null;
    Object.assign(ingreso, { pacienteId: null, motivoIngreso: 'OTRO', diagnosticoInicial: '' });
  }
}

const MENSAJES: Record<AccionCama, string> = {
  'confirmar-limpieza': 'Limpieza confirmada: la cama vuelve a estar libre.',
  bloquear: 'Cama bloqueada por mantenimiento.',
  desbloquear: 'Cama desbloqueada.',
};
const aplicar = (cama: Cama, accion: AccionCama) =>
  accionar(() => recursosService.aplicarAccion(cama.id, accion), MENSAJES[accion]);

const darDeAlta = (cama: Cama) =>
  accionar(
    () => recursosService.darDeAlta(cama.internacion!.id),
    `Alta registrada. La cama ${cama.codigo} pasó a limpieza.`,
  );

const CLASES: Record<string, string> = {
  Libre: 'libre',
  Ocupada: 'ocupada',
  'En limpieza': 'limpieza',
  Bloqueada: 'bloqueada',
};
</script>

<template>
  <h1>Mapa de camas</h1>
  <p class="subtitulo">Estado en tiempo real de todas las camas del hospital.</p>

  <MensajeEstado :error="error" :exito="exito" />

  <section v-if="camaElegida" class="tarjeta">
    <h2>Asignar cama {{ camaElegida.codigo }} (habitación {{ camaElegida.habitacion.numero }})</h2>
    <form class="formulario en-linea" @submit.prevent="asignar">
      <SelectorPaciente v-model="ingreso.pacienteId" />
      <label>
        Motivo de ingreso
        <select v-model="ingreso.motivoIngreso">
          <option value="PRE_QUIRURGICO">Cirugía programada (pre-quirúrgico)</option>
          <option value="INFECCION_RESPIRATORIA">Infección respiratoria</option>
          <option value="OTRO">Otro</option>
        </select>
      </label>
      <label>Diagnóstico inicial <input v-model.trim="ingreso.diagnosticoInicial" maxlength="200" /></label>
      <div class="acciones">
        <button type="submit" :disabled="cargando">Confirmar asignación</button>
        <button type="button" class="secundario" @click="camaElegida = null">Cancelar</button>
      </div>
    </form>
  </section>

  <div class="mapa">
    <article v-for="cama in camas" :key="cama.id" class="cama" :class="CLASES[cama.estado]">
      <header>
        <strong>Cama {{ cama.codigo }}</strong>
        <EtiquetaEstado :texto="cama.estado" />
      </header>
      <p class="ubicacion">Hab. {{ cama.habitacion.numero }} · Piso {{ cama.habitacion.piso }} · {{ cama.habitacion.sector }}</p>

      <p v-if="cama.internacion" class="paciente">
        {{ nombreCompleto(cama.internacion.paciente) }}<br />
        <small>Ingreso: {{ fechaHora(cama.internacion.fechaIngreso) }}</small>
      </p>

      <div class="acciones">
        <button v-if="cama.estado === 'Libre' && puedeAsignar" class="chico" @click="camaElegida = cama">
          Asignar paciente
        </button>
        <button
          v-if="cama.estado === 'Ocupada' && sesion.tieneRol('Médico')"
          class="chico"
          :disabled="cargando"
          @click="darDeAlta(cama)"
        >
          Dar de alta
        </button>
        <button
          v-if="cama.estado === 'En limpieza' && sesion.tieneRol('Recepcionista', 'Enfermero', 'Administrador')"
          class="chico"
          :disabled="cargando"
          @click="aplicar(cama, 'confirmar-limpieza')"
        >
          Confirmar limpieza
        </button>
        <template v-if="sesion.tieneRol('Administrador')">
          <button v-if="cama.estado === 'Libre'" class="chico secundario" :disabled="cargando" @click="aplicar(cama, 'bloquear')">
            Bloquear
          </button>
          <button v-if="cama.estado === 'Bloqueada'" class="chico secundario" :disabled="cargando" @click="aplicar(cama, 'desbloquear')">
            Desbloquear
          </button>
        </template>
      </div>
    </article>
  </div>
</template>

<style scoped>
.mapa {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.cama {
  background: var(--superficie);
  border: 1px solid var(--borde);
  border-top: 5px solid var(--borde);
  border-radius: 10px;
  padding: 14px 16px;
}
.cama.libre {
  border-top-color: var(--verde);
}
.cama.ocupada {
  border-top-color: var(--rojo);
}
.cama.limpieza {
  border-top-color: #e0a800;
}
.cama.bloqueada {
  border-top-color: #8696a0;
  background: var(--gris-fondo);
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ubicacion {
  color: var(--texto-suave);
  font-size: 0.85rem;
  margin: 6px 0 10px;
}
.paciente {
  margin: 0 0 10px;
  font-weight: 600;
}
small {
  font-weight: 400;
  color: var(--texto-suave);
}
</style>
