<script setup lang="ts">
import { computed } from 'vue';

/**
 * Componente reutilizable: muestra un estado (de turno, de cama, etc.)
 * como una etiqueta de color. El color se decide acá, en un solo lugar.
 */
const props = defineProps<{ texto: string }>();

const COLORES: Record<string, string> = {
  // Turnos
  Disponible: 'verde',
  Programado: 'azul',
  Confirmado: 'azul',
  'En Sala de Espera': 'amarillo',
  Atendido: '',
  Cancelado: 'rojo',
  // Camas
  Libre: 'verde',
  Ocupada: 'rojo',
  'En limpieza': 'amarillo',
  Bloqueada: '',
  // Medicación y facturas
  Pendiente: 'amarillo',
  Administrada: 'verde',
  Abierta: 'azul',
  Cerrada: '',
  // Triaje
  Rojo: 'rojo',
  Naranja: 'naranja',
  Amarillo: 'amarillo',
  Verde: 'verde',
  Azul: 'azul',
};

const color = computed(() => COLORES[props.texto] ?? '');
</script>

<template>
  <span class="etiqueta" :class="color">{{ texto }}</span>
</template>
