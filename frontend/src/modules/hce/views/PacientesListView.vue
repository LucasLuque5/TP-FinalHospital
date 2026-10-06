<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useSesionStore } from '@/modules/iam/stores/sesion';
import MensajeEstado from '@/shared/components/MensajeEstado.vue';
import { useAccion } from '@/shared/composables/useAccion';
import type { Paciente } from '@/shared/tipos';
import { fecha } from '@/shared/utils/formato';
import { hceService } from '../services/hce.service';

const sesion = useSesionStore();
const { error, exito, cargando, ejecutar } = useAccion();

const pacientes = ref<Paciente[]>([]);
const buscar = ref('');
const formularioVacio = () => ({
  dni: '',
  nombre: '',
  apellido: '',
  fechaNacimiento: '',
  sexo: '',
  telefono: '',
  email: '',
  direccion: '',
});
const nuevo = reactive(formularioVacio());

async function cargar() {
  pacientes.value = (await ejecutar(() => hceService.listarPacientes(buscar.value))) ?? [];
}
onMounted(cargar);

async function registrar() {
  // Los campos opcionales que quedaron vacíos no se envían.
  const datos = Object.fromEntries(Object.entries(nuevo).filter(([, valor]) => valor !== ''));
  const creado = await ejecutar(() => hceService.registrarPaciente(datos), 'Paciente registrado.');
  if (creado) {
    Object.assign(nuevo, formularioVacio());
    const mensaje = exito.value;
    await cargar();
    exito.value = mensaje;
  }
}
</script>

<template>
  <h1>Pacientes</h1>
  <p class="subtitulo">Ficha demográfica de los pacientes registrados en el hospital.</p>

  <MensajeEstado :error="error" :exito="exito" />

  <section v-if="sesion.tieneRol('Recepcionista', 'Administrador')" class="tarjeta">
    <h2>Registrar paciente</h2>
    <form class="formulario en-linea" @submit.prevent="registrar">
      <label>DNI <input v-model.trim="nuevo.dni" required inputmode="numeric" pattern="\d{7,9}" /></label>
      <label>Nombre <input v-model.trim="nuevo.nombre" required /></label>
      <label>Apellido <input v-model.trim="nuevo.apellido" required /></label>
      <label>Fecha de nacimiento <input v-model="nuevo.fechaNacimiento" type="date" required /></label>
      <label>
        Sexo
        <select v-model="nuevo.sexo">
          <option value="">Sin especificar</option>
          <option value="F">Femenino</option>
          <option value="M">Masculino</option>
          <option value="X">X</option>
        </select>
      </label>
      <label>Teléfono <input v-model.trim="nuevo.telefono" type="tel" /></label>
      <label>Email <input v-model.trim="nuevo.email" type="email" /></label>
      <label>Dirección <input v-model.trim="nuevo.direccion" /></label>
      <button type="submit" :disabled="cargando">Registrar</button>
    </form>
  </section>

  <section class="tarjeta">
    <form class="formulario en-linea" @submit.prevent="cargar">
      <label>
        Buscar por DNI, nombre o apellido
        <input v-model.trim="buscar" type="search" />
      </label>
      <button type="submit" class="secundario">Buscar</button>
    </form>

    <div class="tabla-contenedor">
      <table>
        <thead>
          <tr>
            <th>DNI</th>
            <th>Apellido y nombre</th>
            <th>Nacimiento</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="paciente in pacientes" :key="paciente.id">
            <td>{{ paciente.dni }}</td>
            <td>{{ paciente.apellido }}, {{ paciente.nombre }}</td>
            <td>{{ fecha(paciente.fechaNacimiento) }}</td>
            <td>{{ paciente.telefono ?? '-' }}</td>
            <td>{{ paciente.email ?? '-' }}</td>
            <td>
              <RouterLink
                v-if="sesion.tieneRol('Médico', 'Enfermero')"
                :to="`/hce/pacientes/${paciente.id}/historia`"
              >
                Historia clínica
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="pacientes.length === 0" class="vacio">No se encontraron pacientes.</p>
    </div>
  </section>
</template>
