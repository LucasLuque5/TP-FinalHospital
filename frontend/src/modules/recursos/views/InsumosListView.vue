<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useSesionStore } from '@/modules/iam/stores/sesion';
import MensajeEstado from '@/shared/components/MensajeEstado.vue';
import { useAccion, useMonitor } from '@/shared/composables/useAccion';
import type { Insumo } from '@/shared/tipos';
import { recursosService } from '../services/recursos.service';

const sesion = useSesionStore();
const { error, exito, cargando, ejecutar } = useAccion();

const insumos = ref<Insumo[]>([]);
const ingreso = reactive({ insumoId: null as number | null, cantidad: 10, motivo: 'Reposición de farmacia' });

async function cargar() {
  insumos.value = await recursosService.listarInsumos();
}
// El stock se actualiza solo cuando enfermería administra una dosis.
useMonitor('inventario', cargar);

async function registrarIngreso() {
  await ejecutar(
    () =>
      recursosService.registrarIngreso(ingreso.insumoId!, {
        cantidad: ingreso.cantidad,
        motivo: ingreso.motivo,
      }),
    'Ingreso de stock registrado.',
  );
  await cargar();
}
</script>

<template>
  <h1>Insumos</h1>
  <p class="subtitulo">
    Inventario de insumos médicos del piso. El stock se descuenta automáticamente al administrar medicación.
  </p>

  <MensajeEstado :error="error" :exito="exito" />

  <section v-if="sesion.tieneRol('Administrador')" class="tarjeta">
    <h2>Registrar ingreso de stock</h2>
    <form class="formulario en-linea" @submit.prevent="registrarIngreso">
      <label>
        Insumo
        <select v-model="ingreso.insumoId" required>
          <option :value="null" disabled>Seleccione…</option>
          <option v-for="insumo in insumos" :key="insumo.id" :value="insumo.id">{{ insumo.nombre }}</option>
        </select>
      </label>
      <label>Cantidad <input v-model.number="ingreso.cantidad" type="number" min="1" required /></label>
      <label>Motivo <input v-model.trim="ingreso.motivo" required maxlength="200" /></label>
      <button type="submit" :disabled="cargando">Registrar</button>
    </form>
  </section>

  <section class="tarjeta tabla-contenedor">
    <table>
      <thead>
        <tr>
          <th>Insumo</th>
          <th class="numero">Stock disponible</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="insumo in insumos" :key="insumo.id" :class="{ 'fila-alerta': insumo.stock === 0 }">
          <td>{{ insumo.nombre }}</td>
          <td class="numero">{{ insumo.stock }} unidades</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
