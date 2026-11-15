<script setup lang="ts">
defineProps<{ error?: string; exito?: string }>();
</script>

<template>
  <p v-if="error" class="mensaje error" role="alert">{{ error }}</p>
  <p v-else-if="exito" class="mensaje exito" role="status">{{ exito }}</p>
</template>
