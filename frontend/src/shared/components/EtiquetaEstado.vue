<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ texto: string }>();

const COLORES: Record<string, string> = {
  Disponible: 'verde',
  Programado: 'azul',
  Confirmado: 'azul',
  'En Sala de Espera': 'amarillo',
  Atendido: '',
  Cancelado: 'rojo',
  Libre: 'verde',
  Ocupada: 'rojo',
  'En limpieza': 'amarillo',
  Bloqueada: '',
  Pendiente: 'amarillo',
  Administrada: 'verde',
  Abierta: 'azul',
  Cerrada: '',
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
