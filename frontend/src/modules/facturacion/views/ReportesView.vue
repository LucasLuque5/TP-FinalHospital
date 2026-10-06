<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { dinero } from '@/shared/utils/formato';
import { facturacionService, type ResumenFacturacion } from '../services/facturacion.service';

const PAGADORES: Record<string, string> = {
  PACIENTE: 'Pacientes',
  PREPAGA: 'Prepagas (reclamos a terceros)',
  ESTADO: 'Estado (subsidios)',
};

const resumen = ref<ResumenFacturacion | null>(null);
onMounted(async () => {
  resumen.value = await facturacionService.resumen();
});
</script>

<template>
  <h1>Reportes administrativos</h1>
  <p class="subtitulo">Totales facturados, agrupados por quién paga y por concepto.</p>

  <div v-if="resumen" class="grilla">
    <section class="tarjeta">
      <h2>Por pagador</h2>
      <table>
        <thead>
          <tr>
            <th>A cargo de</th>
            <th class="numero">Cargos</th>
            <th class="numero">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fila in resumen.porPagador" :key="fila.aCargoDe">
            <td>{{ PAGADORES[fila.aCargoDe] }}</td>
            <td class="numero">{{ fila.cantidad }}</td>
            <td class="numero">{{ dinero(fila.total) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="resumen.porPagador.length === 0" class="vacio">Sin datos.</p>
    </section>

    <section class="tarjeta">
      <h2>Por concepto</h2>
      <table>
        <thead>
          <tr>
            <th>Concepto</th>
            <th class="numero">Cargos</th>
            <th class="numero">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fila in resumen.porConcepto" :key="fila.concepto">
            <td>{{ fila.concepto }}</td>
            <td class="numero">{{ fila.cantidad }}</td>
            <td class="numero">{{ dinero(fila.total) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="resumen.porConcepto.length === 0" class="vacio">Sin datos.</p>
    </section>
  </div>
</template>
