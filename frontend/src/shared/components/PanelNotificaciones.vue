<script setup lang="ts">
import { ref } from 'vue';
import { useNotificacionesStore } from '@/shared/stores/notificaciones';
import { fechaHora } from '@/shared/utils/formato';

/**
 * Barra superior con:
 *  - el cartel destacado de la última alerta de prioridad ALTA
 *    (ej. Código Rojo, signos vitales fuera de rango);
 *  - la campana con el historial de notificaciones del usuario.
 */
const notificaciones = useNotificacionesStore();
const abierto = ref(false);

function alternar() {
  abierto.value = !abierto.value;
  if (abierto.value) notificaciones.sinLeer = 0;
}
</script>

<template>
  <div class="barra-superior">
    <div v-if="notificaciones.alertaDestacada" class="alerta" role="alert">
      <div>
        <strong>{{ notificaciones.alertaDestacada.titulo }}</strong>
        {{ notificaciones.alertaDestacada.mensaje }}
      </div>
      <button class="chico" @click="notificaciones.alertaDestacada = null">Entendido</button>
    </div>
    <span v-else></span>

    <div class="campana">
      <button class="secundario chico" :aria-expanded="abierto" @click="alternar">
        Notificaciones
        <span v-if="notificaciones.sinLeer > 0" class="contador">{{ notificaciones.sinLeer }}</span>
      </button>

      <div v-if="abierto" class="lista tarjeta">
        <p v-if="notificaciones.lista.length === 0" class="vacio">No hay notificaciones.</p>
        <article
          v-for="aviso in notificaciones.lista"
          :key="aviso.id"
          :class="{ alta: aviso.prioridad === 'ALTA' }"
        >
          <strong>{{ aviso.titulo }}</strong>
          <p>{{ aviso.mensaje }}</p>
          <small>{{ fechaHora(aviso.creadoEn) }}</small>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.barra-superior {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}
.alerta {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: var(--rojo);
  color: #fff;
  padding: 10px 14px;
  border-radius: 8px;
}
.alerta strong {
  margin-right: 8px;
}
.alerta button {
  background: #fff;
  color: var(--rojo);
  border-color: #fff;
}
.campana {
  position: relative;
}
.contador {
  background: var(--rojo);
  color: #fff;
  border-radius: 999px;
  padding: 0 7px;
  margin-left: 6px;
  font-size: 0.8rem;
}
.lista {
  position: absolute;
  right: 0;
  top: 38px;
  width: 360px;
  max-width: 90vw;
  max-height: 420px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 8px 24px rgba(15, 42, 56, 0.18);
}
article {
  padding: 8px 0 8px 10px;
  border-bottom: 1px solid var(--borde);
  border-left: 3px solid transparent;
}
article.alta {
  border-left-color: var(--rojo);
}
article p {
  margin: 2px 0;
}
small {
  color: var(--texto-suave);
}
</style>
