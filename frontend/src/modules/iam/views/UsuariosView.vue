<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import MensajeEstado from '@/shared/components/MensajeEstado.vue';
import SelectorPaciente from '@/shared/components/SelectorPaciente.vue';
import { useAccion } from '@/shared/composables/useAccion';
import type { Rol, Usuario } from '@/shared/tipos';
import { iamService } from '../services/iam.service';

const { error, exito, cargando, ejecutar } = useAccion();
const usuarios = ref<Usuario[]>([]);
const roles = ref<Rol[]>([]);

const nuevo = reactive({
  nombreUsuario: '',
  password: '',
  nombre: '',
  apellido: '',
  rolId: null as number | null,
  pacienteId: null as number | null,
});
const esRolPaciente = computed(
  () => roles.value.find((rol) => rol.id === nuevo.rolId)?.nombre === 'Paciente',
);

async function cargar() {
  usuarios.value = await iamService.listarUsuarios();
}

onMounted(async () => {
  roles.value = await iamService.listarRoles();
  await cargar();
});

async function crear() {
  const creado = await ejecutar(
    () =>
      iamService.crearUsuario({
        nombreUsuario: nuevo.nombreUsuario,
        password: nuevo.password,
        nombre: nuevo.nombre,
        apellido: nuevo.apellido,
        rolId: nuevo.rolId!,
        pacienteId: esRolPaciente.value ? (nuevo.pacienteId ?? undefined) : undefined,
      }),
    'Usuario creado.',
  );
  if (creado) {
    Object.assign(nuevo, { nombreUsuario: '', password: '', nombre: '', apellido: '', rolId: null, pacienteId: null });
    await cargar();
  }
}

async function cambiarRol(usuario: Usuario, rolId: number) {
  await ejecutar(() => iamService.actualizarUsuario(usuario.id, { rolId }), 'Rol actualizado.');
  await cargar();
}

async function alternarActivo(usuario: Usuario) {
  await ejecutar(
    () => iamService.actualizarUsuario(usuario.id, { activo: !usuario.activo }),
    usuario.activo ? 'Usuario desactivado.' : 'Usuario activado.',
  );
  await cargar();
}
</script>

<template>
  <h1>Usuarios y roles</h1>
  <p class="subtitulo">Cada usuario tiene un rol, y el rol define qué puede hacer en el sistema.</p>

  <MensajeEstado :error="error" :exito="exito" />

  <section class="tarjeta">
    <h2>Nuevo usuario</h2>
    <form class="formulario en-linea" @submit.prevent="crear">
      <label>Usuario <input v-model.trim="nuevo.nombreUsuario" required minlength="3" /></label>
      <label>
        Contraseña
        <input v-model="nuevo.password" type="password" required minlength="8" autocomplete="new-password" />
      </label>
      <label>Nombre <input v-model.trim="nuevo.nombre" required /></label>
      <label>Apellido <input v-model.trim="nuevo.apellido" required /></label>
      <label>
        Rol
        <select v-model="nuevo.rolId" required>
          <option :value="null" disabled>Seleccione…</option>
          <option v-for="rol in roles" :key="rol.id" :value="rol.id">{{ rol.nombre }}</option>
        </select>
      </label>
      <SelectorPaciente v-if="esRolPaciente" v-model="nuevo.pacienteId" etiqueta="Paciente vinculado" />
      <button type="submit" :disabled="cargando">Crear usuario</button>
    </form>
  </section>

  <section class="tarjeta tabla-contenedor">
    <table>
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Nombre</th>
          <th>Rol</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="usuario in usuarios" :key="usuario.id">
          <td>{{ usuario.nombreUsuario }}</td>
          <td>{{ usuario.apellido }}, {{ usuario.nombre }}</td>
          <td>
            <select
              :value="usuario.rol.id"
              :aria-label="`Rol de ${usuario.nombreUsuario}`"
              @change="cambiarRol(usuario, Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="rol in roles" :key="rol.id" :value="rol.id">{{ rol.nombre }}</option>
            </select>
          </td>
          <td>
            <span class="etiqueta" :class="usuario.activo ? 'verde' : 'rojo'">
              {{ usuario.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
          <td>
            <button class="secundario chico" @click="alternarActivo(usuario)">
              {{ usuario.activo ? 'Desactivar' : 'Activar' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
