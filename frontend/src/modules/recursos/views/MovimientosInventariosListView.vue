<script setup lang="ts">
import { ref } from 'vue';
import { useMonitor } from '@/shared/composables/useAccion';
import type { MovimientoInventario } from '@/shared/tipos';
import { fechaHora } from '@/shared/utils/formato';
import { recursosService } from '../services/recursos.service';

const movimientos = ref<MovimientoInventario[]>([]);
useMonitor('inventario', async () => {
  movimientos.value = await recursosService.listarMovimientos();
});
</script>

<template>
  <h1>Movimientos de inventario</h1>
  <p class="subtitulo">
    Cada entrada y salida de stock. Los egresos automáticos guardan el ID del evento que los originó.
  </p>

  <section class="tarjeta tabla-contenedor">
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Insumo</th>
          <th>Tipo</th>
          <th class="numero">Cantidad</th>
          <th>Motivo</th>
          <th>ID de evento</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="movimiento in movimientos" :key="movimiento.id">
          <td>{{ fechaHora(movimiento.fecha) }}</td>
          <td>{{ movimiento.insumo.nombre }}</td>
          <td>
            <span class="etiqueta" :class="movimiento.tipo === 'INGRESO' ? 'verde' : 'amarillo'">
              {{ movimiento.tipo }}
            </span>
          </td>
          <td class="numero">{{ movimiento.tipo === 'EGRESO' ? '-' : '+' }}{{ movimiento.cantidad }}</td>
          <td>{{ movimiento.motivo }}</td>
          <td><code>{{ movimiento.eventoId ?? '-' }}</code></td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
