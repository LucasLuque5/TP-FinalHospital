<script setup lang="ts">
import { reactive, ref } from 'vue';
import MensajeEstado from '@/shared/components/MensajeEstado.vue';
import SelectorPaciente from '@/shared/components/SelectorPaciente.vue';
import { useAccion, useMonitor } from '@/shared/composables/useAccion';
import type { Cama } from '@/shared/tipos';
import TarjetaCama from '../components/TarjetaCama.vue';
import { recursosService, type AccionCama } from '../services/recursos.service';

const { error, exito, cargando, ejecutar } = useAccion();

const camas = ref<Cama[]>([]);
const camaElegida = ref<Cama | null>(null);
const ingreso = reactive({
  pacienteId: null as number | null,
  motivoIngreso: 'OTRO',
  diagnosticoInicial: '',
});

async function cargar() {
  camas.value = await recursosService.mapaDeCamas();
}
useMonitor('camas', cargar);

async function accionar(accion: () => Promise<unknown>, mensaje: string) {
  await ejecutar(accion, mensaje);
  await cargar();
}

async function asignar() {
  if (!camaElegida.value || !ingreso.pacienteId) {
    error.value = 'Seleccione un paciente.';
    return;
  }
  const cama = camaElegida.value;
  await accionar(
    () =>
      recursosService.asignarCama(cama.id, {
        pacienteId: ingreso.pacienteId!,
        motivoIngreso: ingreso.motivoIngreso,
        diagnosticoInicial: ingreso.diagnosticoInicial || undefined,
      }),
    `Paciente asignado a la cama ${cama.codigo}.`,
  );
  if (!error.value) {
    camaElegida.value = null;
    Object.assign(ingreso, { pacienteId: null, motivoIngreso: 'OTRO', diagnosticoInicial: '' });
  }
}

const MENSAJES: Record<AccionCama, string> = {
  'confirmar-limpieza': 'Limpieza confirmada: la cama vuelve a estar libre.',
  bloquear: 'Cama bloqueada por mantenimiento.',
  desbloquear: 'Cama desbloqueada.',
};
const aplicar = (cama: Cama, accion: AccionCama) =>
  accionar(() => recursosService.aplicarAccion(cama.id, accion), MENSAJES[accion]);

const darDeAlta = (cama: Cama) =>
  accionar(
    () => recursosService.darDeAlta(cama.internacion!.id),
    `Alta registrada. La cama ${cama.codigo} pasó a limpieza.`,
  );
</script>

<template>
  <h1>Mapa de camas</h1>
  <p class="subtitulo">Estado en tiempo real de todas las camas del hospital.</p>

  <MensajeEstado :error="error" :exito="exito" />

  <section v-if="camaElegida" class="tarjeta">
    <h2>Asignar cama {{ camaElegida.codigo }} (habitación {{ camaElegida.habitacion.numero }})</h2>
    <form class="formulario en-linea" @submit.prevent="asignar">
      <SelectorPaciente v-model="ingreso.pacienteId" />
      <label>
        Motivo de ingreso
        <select v-model="ingreso.motivoIngreso">
          <option value="PRE_QUIRURGICO">Cirugía programada (pre-quirúrgico)</option>
          <option value="INFECCION_RESPIRATORIA">Infección respiratoria</option>
          <option value="OTRO">Otro</option>
        </select>
      </label>
      <label>Diagnóstico inicial <input v-model.trim="ingreso.diagnosticoInicial" maxlength="200" /></label>
      <div class="acciones">
        <button type="submit" :disabled="cargando">Confirmar asignación</button>
        <button type="button" class="secundario" @click="camaElegida = null">Cancelar</button>
      </div>
    </form>
  </section>

  <div class="mapa">
    <TarjetaCama
      v-for="cama in camas"
      :key="cama.id"
      :cama="cama"
      :ocupado="cargando"
      @asignar="camaElegida = $event"
      @alta="darDeAlta"
      @accion="aplicar"
    />
  </div>
</template>

<style scoped>
.mapa {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
</style>
