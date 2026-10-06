<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import EtiquetaEstado from '@/shared/components/EtiquetaEstado.vue';
import MensajeEstado from '@/shared/components/MensajeEstado.vue';
import SelectorPaciente from '@/shared/components/SelectorPaciente.vue';
import { useAccion } from '@/shared/composables/useAccion';
import type { Factura, Prestacion } from '@/shared/tipos';
import { dinero, fechaHora, nombreCompleto } from '@/shared/utils/formato';
import { facturacionService } from '../services/facturacion.service';

const { error, exito, cargando, ejecutar } = useAccion();

const facturas = ref<Factura[]>([]);
const prestaciones = ref<Prestacion[]>([]);
const orden = reactive({ pacienteId: null as number | null, prestacionId: null as number | null });
/** Factura recién generada, para mostrar cómo se repartió el costo. */
const generada = ref<Factura | null>(null);

const PAGADORES: Record<string, string> = {
  PACIENTE: 'Paciente',
  PREPAGA: 'Prepaga (reclamo a terceros)',
  ESTADO: 'Estado (subsidio)',
};

async function cargar() {
  facturas.value = await facturacionService.listarFacturas();
}
onMounted(async () => {
  prestaciones.value = await facturacionService.listarPrestaciones();
  orden.prestacionId = prestaciones.value[0]?.id ?? null;
  await cargar();
});

async function facturar() {
  if (!orden.pacienteId) {
    error.value = 'Seleccione un paciente.';
    return;
  }
  generada.value =
    (await ejecutar(
      () => facturacionService.facturarPrestacion(orden.pacienteId!, orden.prestacionId!),
      'Prestación facturada según la cobertura del paciente.',
    )) ?? null;
  await cargar();
}

/** Suma lo que le corresponde pagar a un pagador dentro de una factura. */
const total = (factura: Factura, pagador?: string) =>
  factura.items
    .filter((item) => !pagador || item.aCargoDe === pagador)
    .reduce((suma, item) => suma + item.importe, 0);
</script>

<template>
  <h1>Facturas</h1>
  <p class="subtitulo">
    Prestaciones facturadas y cuentas de gastos de internación. Los cargos se generan solos al atender un turno o
    administrar medicación.
  </p>

  <MensajeEstado :error="error" :exito="exito" />

  <section class="tarjeta">
    <h2>Facturar una prestación</h2>
    <form class="formulario en-linea" @submit.prevent="facturar">
      <SelectorPaciente v-model="orden.pacienteId" />
      <label>
        Prestación (nomenclador)
        <select v-model="orden.prestacionId" required>
          <option v-for="prestacion in prestaciones" :key="prestacion.id" :value="prestacion.id">
            {{ prestacion.nombre }} — {{ dinero(prestacion.valorBase) }}
          </option>
        </select>
      </label>
      <button type="submit" :disabled="cargando">Calcular y facturar</button>
    </form>

    <table v-if="generada" class="resultado">
      <caption>
        Factura N.º {{ generada.id }} — {{ nombreCompleto(generada.paciente) }}
      </caption>
      <thead>
        <tr>
          <th>A cargo de</th>
          <th>Detalle</th>
          <th class="numero">Importe</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in generada.items" :key="item.id">
          <td>{{ PAGADORES[item.aCargoDe] }}</td>
          <td>{{ item.descripcion }}<span v-if="item.obraSocial"> — {{ item.obraSocial.nombre }}</span></td>
          <td class="numero">{{ dinero(item.importe) }}</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="tarjeta tabla-contenedor">
    <h2>Facturas emitidas</h2>
    <table>
      <thead>
        <tr>
          <th>N.º</th>
          <th>Fecha</th>
          <th>Paciente</th>
          <th>Tipo</th>
          <th>Estado</th>
          <th class="numero">Paciente</th>
          <th class="numero">Prepaga</th>
          <th class="numero">Estado</th>
          <th class="numero">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="factura in facturas" :key="factura.id">
          <td>{{ factura.id }}</td>
          <td>{{ fechaHora(factura.creadoEn) }}</td>
          <td>{{ nombreCompleto(factura.paciente) }}</td>
          <td>{{ factura.tipo === 'ESTADIA' ? 'Cuenta de estadía' : 'Prestación' }}</td>
          <td><EtiquetaEstado :texto="factura.estado" /></td>
          <td class="numero">{{ dinero(total(factura, 'PACIENTE')) }}</td>
          <td class="numero">{{ dinero(total(factura, 'PREPAGA')) }}</td>
          <td class="numero">{{ dinero(total(factura, 'ESTADO')) }}</td>
          <td class="numero"><strong>{{ dinero(total(factura)) }}</strong></td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.resultado {
  margin-top: 16px;
  background: var(--azul-fondo);
  border-radius: 8px;
}
caption {
  text-align: left;
  font-weight: 700;
  padding: 10px;
}
</style>
