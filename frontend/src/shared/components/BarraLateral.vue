<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSesionStore } from '@/modules/iam/stores/sesion';
import { useNotificacionesStore } from '@/shared/stores/notificaciones';

const router = useRouter();
const ruta = useRoute();
const sesion = useSesionStore();
const notificaciones = useNotificacionesStore();

const menuAbierto = ref(false);
watch(() => ruta.fullPath, () => (menuAbierto.value = false));

const grupos = computed(() => {
  const resultado = new Map<string, { titulo: string; ruta: string }[]>();
  for (const ruta of router.getRoutes()) {
    const { titulo, grupo, roles } = ruta.meta;
    if (!titulo || !grupo) continue;
    if (roles && !sesion.tieneRol(...roles)) continue;
    if (!resultado.has(grupo)) resultado.set(grupo, []);
    resultado.get(grupo)!.push({ titulo, ruta: ruta.path });
  }
  return resultado;
});

function salir() {
  notificaciones.detener();
  sesion.cerrarSesion();
  router.push('/login');
}
</script>

<template>
  <aside class="barra">
    <div class="cabecera">
      <div class="marca">Hospital<span>HIS</span></div>
      <button
        class="boton-menu secundario chico"
        :aria-expanded="menuAbierto"
        aria-controls="menu-principal"
        @click="menuAbierto = !menuAbierto"
      >
        {{ menuAbierto ? 'Cerrar' : 'Menú' }}
      </button>
    </div>

    <nav id="menu-principal" aria-label="Menú principal" :class="{ abierto: menuAbierto }">
      <section v-for="[grupo, enlaces] in grupos" :key="grupo">
        <h3>{{ grupo }}</h3>
        <RouterLink v-for="enlace in enlaces" :key="enlace.ruta" :to="enlace.ruta">
          {{ enlace.titulo }}
        </RouterLink>
      </section>
    </nav>

    <div class="usuario" :class="{ abierto: menuAbierto }">
      <strong>{{ sesion.usuario?.nombreCompleto }}</strong>
      <span>{{ sesion.usuario?.rol }}</span>
      <button class="secundario chico" @click="salir">Cerrar sesión</button>
    </div>
  </aside>
</template>

<style scoped>
.barra {
  width: 230px;
  flex-shrink: 0;
  background: #0f2a38;
  color: #d5e3ea;
  display: flex;
  flex-direction: column;
  padding: 18px 12px;
}
.marca {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  padding: 0 8px 14px;
}
.marca span {
  color: #5cc8e6;
  margin-left: 6px;
  font-weight: 400;
}
nav {
  flex: 1;
  overflow-y: auto;
}
h3 {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7f9aa8;
  margin: 16px 8px 6px;
}
a {
  display: block;
  padding: 7px 10px;
  border-radius: 6px;
  color: inherit;
  text-decoration: none;
}
a:hover {
  background: #183d50;
}
a.router-link-active {
  background: var(--primario);
  color: #fff;
  font-weight: 600;
}
.usuario {
  display: grid;
  gap: 4px;
  padding: 12px 8px 0;
  border-top: 1px solid #28485a;
  font-size: 0.9rem;
}
.usuario span {
  color: #8fb0bf;
  margin-bottom: 6px;
}
.cabecera {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.boton-menu {
  display: none;
}
@media (max-width: 800px) {
  .barra {
    width: 100%;
    padding: 12px 16px;
  }
  .marca {
    padding: 0;
  }
  .boton-menu {
    display: inline-block;
  }
  nav,
  .usuario {
    display: none;
  }
  nav.abierto,
  .usuario.abierto {
    display: block;
  }
  .usuario.abierto {
    display: grid;
  }
}
</style>
