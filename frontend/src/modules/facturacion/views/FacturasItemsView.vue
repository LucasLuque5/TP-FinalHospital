<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { FacturaItem } from '@/shared/tipos';
import { dinero, fechaHora, nombreCompleto } from '@/shared/utils/formato';
import { facturacionService } from '../services/facturacion.service';

const items = ref<FacturaItem[]>([]);
onMounted(async () => {
  items.value = await facturacionService.listarItems();
});
</script>

<template>
  <h1>Cargos (ítems de factura)</h1>
  <p class="subtitulo">
    Todas las líneas de cargo. Las generadas automáticamente por un evento muestran el ID del evento original
    (trazabilidad de auditoría).
  </p>

  <section class="tarjeta tabla-contenedor">
    <p v-if="items.length === 0" class="vacio">Todavía no hay cargos.</p>
    <table v-else>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Factura</th>
          <th>Paciente</th>
          <th>Concepto</th>
          <th>Descripción</th>
          <th>A cargo de</th>
          <th class="numero">Importe</th>
          <th>ID de evento</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>{{ fechaHora(item.creadoEn) }}</td>
          <td>N.º {{ item.factura?.id }}</td>
          <td>{{ nombreCompleto(item.factura?.paciente) }}</td>
          <td>{{ item.concepto }}</td>
          <td>{{ item.cantidad }} × {{ item.descripcion }}</td>
          <td><span class="etiqueta azul">{{ item.aCargoDe }}</span></td>
          <td class="numero">{{ dinero(item.importe) }}</td>
          <td><code>{{ item.eventoId ?? '-' }}</code></td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
