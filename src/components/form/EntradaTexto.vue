<template>
  <ion-input
    class="entrada"
    :class="{ 'entrada--error': invalido }"
    fill="outline"
    :value="modelValue"
    :type="tipo"
    :inputmode="teclado"
    :placeholder="ejemplo"
    :maxlength="maximo"
    :min="minimo"
    :max="maximoFecha"
    :autocapitalize="mayusculas"
    :aria-label="etiqueta"
    @ion-input="emitir"
    @ion-change="emitir"
  >
    <span v-if="unidad" slot="end" class="entrada-unidad">{{ unidad }}</span>
  </ion-input>
</template>

<script setup lang="ts">
import { IonInput } from '@ionic/vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    etiqueta: string;
    tipo?: 'text' | 'date' | 'time';
    teclado?: 'text' | 'numeric' | 'decimal';
    ejemplo?: string;
    unidad?: string;
    maximo?: number;
    minimo?: string;
    maximoFecha?: string;
    mayusculas?: 'off' | 'words' | 'characters' | 'sentences';
    invalido?: boolean;
  }>(),
  { tipo: 'text', teclado: 'text', mayusculas: 'sentences' },
);

const emit = defineEmits<{ 'update:modelValue': [valor: string] }>();

function emitir(e: CustomEvent<{ value?: string | number | null }>) {
  const valor = String(e.detail.value ?? '');
  if (valor !== props.modelValue) emit('update:modelValue', valor);
}
</script>

<style scoped>
.entrada {
  --background: #ffffff;
  --border-color: var(--app-borde);
  --border-width: 1.5px;
  --border-radius: 12px;
  --highlight-color-focused: var(--ion-color-primary);
  --padding-start: 14px;
  --padding-end: 14px;
  --placeholder-color: #7d8c88;
  --placeholder-opacity: 1;
  --color: var(--app-texto);
  min-height: 54px;
  font-size: 1.0625rem;
}
.entrada--error {
  --border-color: var(--ion-color-danger);
  --border-width: 2px;
  --background: var(--app-error-suave);
}
.entrada-unidad {
  color: var(--app-texto-suave);
  font-weight: 600;
  font-size: 0.95rem;
}
</style>
