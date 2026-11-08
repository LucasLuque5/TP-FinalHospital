<script setup lang="ts">
/**
 * Contenedor reutilizable con título. El contenido lo decide quien lo usa,
 * por medio de SLOTS (huecos que se rellenan desde afuera):
 *
 *   <TarjetaSeccion titulo="Lista de espera" descripcion="…">
 *     <template #encabezado> <span class="etiqueta">3</span> </template>   ← slot con nombre
 *     <ol> … </ol>                                                          ← slot por defecto
 *     <template #pie> <button>Agregar</button> </template>                  ← slot con nombre
 *   </TarjetaSeccion>
 */
defineProps<{ titulo: string; descripcion?: string }>();

// Permite usar en el template "$slots.pie" con tipos.
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
