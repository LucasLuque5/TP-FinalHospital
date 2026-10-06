<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { ObraSocial } from '@/shared/tipos';
import { dinero } from '@/shared/utils/formato';
import { facturacionService } from '../services/facturacion.service';

const REGLAS: Record<string, string> = {
  PUBLICA: 'Subsidia el 100 % del costo. El paciente no abona.',
  PREPAGA: 'El paciente abona un copago fijo y el resto se factura a la prepaga.',
};

const obrasSociales = ref<ObraSocial[]>([]);
onMounted(async () => {
  obrasSociales.value = await facturacionService.listarObrasSociales();
});
</script>

<template>
  <h1>Obras sociales</h1>
  <p class="subtitulo">Cada tipo de cobertura usa una estrategia distinta para calcular el costo de una prestación.</p>

  <section class="tarjeta tabla-contenedor">
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Tipo</th>
          <th class="numero">Copago fijo</th>
          <th>Regla de cobro</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="obra in obrasSociales" :key="obra.id">
          <td>{{ obra.nombre }}</td>
          <td><span class="etiqueta azul">{{ obra.tipo }}</span></td>
          <td class="numero">{{ obra.tipo === 'PREPAGA' ? dinero(obra.copagoFijo) : '-' }}</td>
          <td>{{ REGLAS[obra.tipo] }}</td>
        </tr>
        <tr>
          <td>Particular (sin cobertura)</td>
          <td><span class="etiqueta">PARTICULAR</span></td>
          <td class="numero">-</td>
          <td>El paciente abona el 100 % del valor base del nomenclador.</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
