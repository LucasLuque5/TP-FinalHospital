<script setup lang="ts">
/** Muestra el resultado de una acción: un cartel rojo de error o uno verde de éxito. */
defineProps<{ error?: string; exito?: string }>();
</script>

<template>
  <p v-if="error" class="mensaje error" role="alert">{{ error }}</p>
  <p v-else-if="exito" class="mensaje exito" role="status">{{ exito }}</p>
</template>
