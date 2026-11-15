<script setup lang="ts">
defineProps<{ titulo: string; descripcion?: string }>();

defineSlots<{
  default(): unknown;
  encabezado?(): unknown;
  pie?(): unknown;
}>();
</script>

<template>
  <section class="tarjeta">
    <header>
      <h2>{{ titulo }}</h2>
      <slot name="encabezado" />
    </header>
    <p v-if="descripcion" class="subtitulo">{{ descripcion }}</p>

    <slot />

    <footer v-if="$slots.pie">
      <slot name="pie" />
    </footer>
  </section>
</template>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
}
.subtitulo {
  margin-bottom: 12px;
}
footer {
  margin-top: 12px;
}
</style>
