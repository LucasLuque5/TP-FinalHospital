<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSesionStore } from '@/modules/iam/stores/sesion';

const router = useRouter();
const sesion = useSesionStore();

const pestanas = computed(() => {
  const padre = router.getRoutes().find((ruta) => ruta.name === 'facturacion');
  return (padre?.children ?? []).filter(
    (hija) => !hija.meta?.roles || sesion.tieneRol(...hija.meta.roles),
  );
});
</script>

<template>
  <nav class="pestanas" aria-label="Secciones de facturación">
    <RouterLink v-for="hija in pestanas" :key="String(hija.name)" :to="{ name: hija.name }">
      {{ hija.meta?.titulo }}
    </RouterLink>
  </nav>

  <RouterView />
</template>

<style scoped>
.pestanas {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  border-bottom: 2px solid var(--borde);
  margin-bottom: 20px;
}
a {
  padding: 8px 14px;
  border-radius: 6px 6px 0 0;
  color: var(--texto-suave);
  text-decoration: none;
  font-weight: 600;
  margin-bottom: -2px;
  border-bottom: 2px solid transparent;
}
a:hover {
  color: var(--primario);
}
a.router-link-active {
  color: var(--primario);
  border-bottom-color: var(--primario);
}
</style>
