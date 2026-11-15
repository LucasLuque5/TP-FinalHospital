<script setup lang="ts">
import { useSesionStore } from '@/modules/iam/stores/sesion';
import EtiquetaEstado from '@/shared/components/EtiquetaEstado.vue';
import type { Cama } from '@/shared/tipos';
import { fechaHora, nombreCompleto } from '@/shared/utils/formato';
import type { AccionCama } from '../services/recursos.service';

defineProps<{
  cama: Cama;
  ocupado: boolean;
}>();

const emit = defineEmits<{
  asignar: [cama: Cama];
  alta: [cama: Cama];
  accion: [cama: Cama, accion: AccionCama];
}>();

const sesion = useSesionStore();

const CLASES: Record<string, string> = {
  Libre: 'libre',
  Ocupada: 'ocupada',
  'En limpieza': 'limpieza',
  Bloqueada: 'bloqueada',
};
</script>

<template>
  <article class="cama" :class="CLASES[cama.estado]">
    <header>
      <strong>Cama {{ cama.codigo }}</strong>
      <EtiquetaEstado :texto="cama.estado" />
    </header>
    <p class="ubicacion">
      Hab. {{ cama.habitacion.numero }} · Piso {{ cama.habitacion.piso }} · {{ cama.habitacion.sector }}
    </p>

    <p v-if="cama.internacion" class="paciente">
      {{ nombreCompleto(cama.internacion.paciente) }}<br />
      <small>Ingreso: {{ fechaHora(cama.internacion.fechaIngreso) }}</small>
    </p>

    <div class="acciones">
      <button
        v-if="cama.estado === 'Libre' && sesion.tieneRol('Recepcionista', 'Administrador')"
        class="chico"
        @click="emit('asignar', cama)"
      >
        Asignar paciente
      </button>
      <button
        v-if="cama.estado === 'Ocupada' && sesion.tieneRol('Médico')"
        class="chico"
        :disabled="ocupado"
        @click="emit('alta', cama)"
      >
        Dar de alta
      </button>
      <button
        v-if="cama.estado === 'En limpieza' && sesion.tieneRol('Recepcionista', 'Enfermero', 'Administrador')"
        class="chico"
        :disabled="ocupado"
        @click="emit('accion', cama, 'confirmar-limpieza')"
      >
        Confirmar limpieza
      </button>
      <template v-if="sesion.tieneRol('Administrador')">
        <button
          v-if="cama.estado === 'Libre'"
          class="chico secundario"
          :disabled="ocupado"
          @click="emit('accion', cama, 'bloquear')"
        >
          Bloquear
        </button>
        <button
          v-if="cama.estado === 'Bloqueada'"
          class="chico secundario"
          :disabled="ocupado"
          @click="emit('accion', cama, 'desbloquear')"
        >
          Desbloquear
        </button>
      </template>
    </div>
  </article>
</template>

<style scoped>
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
