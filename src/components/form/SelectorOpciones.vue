<template>
  <div
    class="opciones"
    role="radiogroup"
    :aria-labelledby="etiquetadoPor"
    :style="{ gridTemplateColumns: `repeat(${columnasEfectivas}, minmax(0, 1fr))` }"
    :class="{ 'opciones--error': invalido }"
  >
    <button
      v-for="o in todas"
      :key="o.valor"
      type="button"
      role="radio"
      class="opcion"
      :class="{ 'opcion--activa': o.valor === modelValue }"
      :aria-checked="o.valor === modelValue"
      @click="emit('update:modelValue', o.valor)"
    >
      <ion-icon v-if="o.valor === modelValue" :icon="checkmarkCircle" aria-hidden="true" />
      <span v-else-if="colores?.[o.valor]" class="opcion-punto" :style="{ background: colores[o.valor] }" />
      <span>{{ o.texto }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { checkmarkCircle } from 'ionicons/icons';
import { computed } from 'vue';

/**
 * Todas las opciones a la vista y un toque para elegir: más rápido y claro en la playa que una lista desplegable.
 */
const props = defineProps<{
  modelValue: string;
  opciones: string[];
  etiquetadoPor?: string;
  /** Texto de una opción extra con valor vacío (ej. "Ninguna"). */
  opcionVacia?: string;
  columnas?: number;
  colores?: Record<string, string>;
  invalido?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [valor: string] }>();

const todas = computed(() => [
  ...(props.opcionVacia ? [{ valor: '', texto: props.opcionVacia }] : []),
  ...props.opciones.map((o) => ({ valor: o, texto: o })),
]);

const columnasEfectivas = computed(() => {
  if (props.columnas) return props.columnas;
  const n = todas.value.length;
  const masLarga = Math.max(0, ...todas.value.map((o) => o.texto.length));
  if (masLarga > 12) return Math.min(n, 2);
  return n <= 3 ? Math.max(n, 1) : 3;
});
</script>

<style scoped>
.opciones {
  display: grid;
  gap: 8px;
  border-radius: 14px;
}
.opciones--error {
  outline: 2px solid var(--ion-color-danger);
  outline-offset: 4px;
}
.opcion {
  min-height: 52px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1.5px solid var(--app-borde);
  background: #ffffff;
  color: var(--app-texto);
  font-size: 1rem;
  font-weight: 550;
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}
.opcion:active {
  background: var(--app-primario-suave);
}
.opcion--activa {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
  color: #ffffff;
  font-weight: 700;
}
.opcion--activa:active {
  background: var(--ion-color-primary-shade);
}
.opcion ion-icon {
  flex: none;
  font-size: 1.15rem;
}
.opcion-punto {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #fff;
}
</style>
