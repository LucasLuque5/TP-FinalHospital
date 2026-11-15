<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { hceService } from '@/modules/hce/services/hce.service';
import type { Paciente } from '@/shared/tipos';

const pacienteId = defineModel<number | null>({ required: true });
defineProps<{ etiqueta?: string }>();

const pacientes = ref<Paciente[]>([]);
onMounted(async () => {
  pacientes.value = await hceService.listarPacientes();
});
</script>

<template>
  <label>
    {{ etiqueta ?? 'Paciente' }}
    <select v-model="pacienteId">
      <option :value="null">Seleccione un paciente…</option>
      <option v-for="paciente in pacientes" :key="paciente.id" :value="paciente.id">
        {{ paciente.apellido }}, {{ paciente.nombre }} (DNI {{ paciente.dni }})
      </option>
    </select>
  </label>
</template>
