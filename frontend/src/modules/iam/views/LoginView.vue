<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import MensajeEstado from '@/shared/components/MensajeEstado.vue';
import { useAccion } from '@/shared/composables/useAccion';
import { useSesionStore } from '../stores/sesion';

const router = useRouter();
const sesion = useSesionStore();
const { error, cargando, ejecutar } = useAccion();

const nombreUsuario = ref('');
const password = ref('');

async function ingresar() {
  await ejecutar(() => sesion.iniciarSesion(nombreUsuario.value, password.value));
  // Si no hubo error, el guard del router lleva a la pantalla inicial del rol.
  if (sesion.estaAutenticado) router.push('/inicio');
}
</script>

<template>
  <main class="login">
    <form class="tarjeta formulario" @submit.prevent="ingresar">
      <div>
        <h1>Hospital HIS</h1>
        <p class="subtitulo">Sistema de Información Hospitalaria</p>
      </div>

      <MensajeEstado :error="error" />

      <label>
        Usuario
        <input v-model.trim="nombreUsuario" autocomplete="username" required autofocus />
      </label>
      <label>
        Contraseña
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>

      <button type="submit" :disabled="cargando">
        {{ cargando ? 'Ingresando…' : 'Ingresar' }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 16px;
  background: #0f2a38;
}
form {
  width: 100%;
  max-width: 360px;
  margin: 0;
}
.subtitulo {
  margin-bottom: 0;
}
</style>
