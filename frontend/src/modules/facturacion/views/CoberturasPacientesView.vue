<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import MensajeEstado from '@/shared/components/MensajeEstado.vue';
import SelectorPaciente from '@/shared/components/SelectorPaciente.vue';
import { useAccion } from '@/shared/composables/useAccion';
import type { Cobertura, CoberturaValidada, ObraSocial } from '@/shared/tipos';
import { dinero, nombreCompleto } from '@/shared/utils/formato';
import { facturacionService } from '../services/facturacion.service';

const { error, exito, cargando, ejecutar } = useAccion();

const coberturas = ref<Cobertura[]>([]);
const obrasSociales = ref<ObraSocial[]>([]);
const nueva = reactive({ pacienteId: null as number | null, obraSocialId: null as number | null, numeroAfiliado: '' });
const validada = ref<CoberturaValidada | null>(null);

async function cargar() {
  coberturas.value = await facturacionService.listarCoberturas();
}
onMounted(async () => {
  obrasSociales.value = await facturacionService.listarObrasSociales();
  await cargar();
});

/** Validación de cobertura: consulta qué obra social tiene vigente el paciente. */
async function validar() {
  validada.value = null;
  if (!nueva.pacienteId) {
    error.value = 'Seleccione un paciente.';
    return;
  }
  validada.value = (await ejecutar(() => facturacionService.validarCobertura(nueva.pacienteId!))) ?? null;
}

async function asignar() {
  if (!nueva.pacienteId) {
    error.value = 'Seleccione un paciente.';
    return;
  }
  await ejecutar(
    () =>
      facturacionService.asignarCobertura({
        pacienteId: nueva.pacienteId!,
        obraSocialId: nueva.obraSocialId!,
        numeroAfiliado: nueva.numeroAfiliado,
      }),
    'Cobertura asignada.',
  );
  validada.value = null;
  await cargar();
}
</script>

<template>
  <h1>Coberturas de pacientes</h1>
  <p class="subtitulo">Los pacientes que no figuran en esta lista se facturan como particulares.</p>

  <MensajeEstado :error="error" :exito="exito" />

  <section class="tarjeta">
    <h2>Validar o asignar cobertura</h2>
    <form class="formulario en-linea" @submit.prevent="asignar">
      <SelectorPaciente v-model="nueva.pacienteId" />
      <label>
        Obra social
        <select v-model="nueva.obraSocialId" required>
          <option :value="null" disabled>Seleccione…</option>
          <option v-for="obra in obrasSociales" :key="obra.id" :value="obra.id">{{ obra.nombre }}</option>
        </select>
      </label>
      <label>N.º de afiliado <input v-model.trim="nueva.numeroAfiliado" required maxlength="30" /></label>
      <div class="acciones">
        <button type="button" class="secundario" :disabled="cargando" @click="validar">Validar cobertura</button>
        <button type="submit" :disabled="cargando">Asignar</button>
      </div>
    </form>

    <p v-if="validada" class="mensaje exito">
      <template v-if="validada.obraSocial">
        Cobertura vigente: {{ validada.obraSocial.nombre }} ({{ validada.tipo }}), afiliado
        {{ validada.numeroAfiliado }}.
        <template v-if="validada.tipo === 'PREPAGA'">
          Copago por consulta: {{ dinero(validada.obraSocial.copagoFijo) }}.
        </template>
      </template>
      <template v-else>Sin cobertura vigente: se factura como PARTICULAR.</template>
    </p>
  </section>

  <section class="tarjeta tabla-contenedor">
    <table>
      <thead>
        <tr>
          <th>Paciente</th>
          <th>Obra social</th>
          <th>Tipo</th>
          <th>N.º de afiliado</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cobertura in coberturas" :key="cobertura.id">
          <td>{{ nombreCompleto(cobertura.paciente) }}</td>
          <td>{{ cobertura.obraSocial.nombre }}</td>
          <td><span class="etiqueta azul">{{ cobertura.obraSocial.tipo }}</span></td>
          <td>{{ cobertura.numeroAfiliado }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.mensaje {
  margin: 14px 0 0;
}
</style>
