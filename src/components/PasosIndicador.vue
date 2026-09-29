<template>
  <ol class="pasos" aria-label="Pasos del registro">
    <li
      v-for="(titulo, i) in pasos"
      :key="titulo"
      class="paso"
      :class="{ 'paso--hecho': i < actual, 'paso--actual': i === actual }"
      :aria-current="i === actual ? 'step' : undefined"
    >
      <button type="button" class="paso-boton" :disabled="i > actual" @click="emit('ir', i)">
        <span class="paso-circulo">
          <ion-icon v-if="i < actual" :icon="checkmark" aria-hidden="true" />
          <template v-else>{{ i + 1 }}</template>
        </span>
        <span class="paso-titulo">{{ titulo }}</span>
      </button>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { checkmark } from 'ionicons/icons';

defineProps<{ pasos: string[]; actual: number }>();
const emit = defineEmits<{ ir: [paso: number] }>();
</script>

<style scoped>
.pasos {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 10px 12px 12px;
  gap: 4px;
}
.paso {
  flex: 1;
  position: relative;
}
/* Línea que une los círculos */
.paso:not(:first-child)::before {
  content: '';
  position: absolute;
  top: 17px;
  right: 50%;
  width: 100%;
  height: 3px;
  background: var(--app-borde-suave);
  z-index: 0;
}
.paso--hecho:not(:first-child)::before,
.paso--actual:not(:first-child)::before {
  background: var(--ion-color-primary);
}
.paso-boton {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: none;
  border: 0;
  padding: 0;
  color: var(--app-texto-suave);
  cursor: pointer;
}
.paso-boton:disabled {
  cursor: default;
}
.paso-circulo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  background: #ffffff;
  border: 2px solid var(--app-borde);
  color: var(--app-texto-suave);
}
.paso--hecho .paso-circulo {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
  color: #ffffff;
  font-size: 1.2rem;
}
.paso--actual .paso-circulo {
  border-color: var(--ion-color-primary);
  color: var(--ion-color-primary);
  box-shadow: 0 0 0 4px var(--app-primario-suave);
}
.paso-titulo {
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
}
.paso--actual .paso-titulo {
  color: var(--app-texto);
  font-weight: 700;
}
</style>
