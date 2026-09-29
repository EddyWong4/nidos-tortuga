<template>
  <div class="numero">
    <button
      type="button"
      class="numero-boton"
      :aria-label="`Restar 1 a ${etiqueta}`"
      :disabled="valorActual != null && valorActual <= minimo"
      @click="cambiar(-1)"
    >
      <ion-icon :icon="remove" aria-hidden="true" />
    </button>
    <EntradaTexto
      class="numero-entrada"
      :model-value="modelValue"
      :etiqueta="etiqueta"
      teclado="numeric"
      :ejemplo="ejemplo ?? `${minimo} a ${maximo}`"
      :unidad="unidad"
      :invalido="invalido"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <button
      type="button"
      class="numero-boton"
      :aria-label="`Sumar 1 a ${etiqueta}`"
      :disabled="valorActual != null && valorActual >= maximo"
      @click="cambiar(1)"
    >
      <ion-icon :icon="add" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { add, remove } from 'ionicons/icons';
import { computed } from 'vue';
import EntradaTexto from './EntradaTexto.vue';
import { aNumero } from '@/domain/formulario';

const props = defineProps<{
  modelValue: string;
  etiqueta: string;
  minimo: number;
  maximo: number;
  ejemplo?: string;
  unidad?: string;
  invalido?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [valor: string] }>();

const valorActual = computed(() => {
  const n = aNumero(props.modelValue);
  return n == null || Number.isNaN(n) ? null : n;
});

/** Botones − / + para ajustar sin abrir el teclado (útil con guantes o manos con arena). */
function cambiar(delta: number) {
  const base = valorActual.value ?? (delta > 0 ? props.minimo - 1 : props.minimo + 1);
  const nuevo = Math.min(props.maximo, Math.max(props.minimo, Math.round(base) + delta));
  emit('update:modelValue', String(nuevo));
}
</script>

<style scoped>
.numero {
  display: flex;
  align-items: stretch;
  gap: 8px;
}
.numero-entrada {
  flex: 1;
  min-width: 0;
  text-align: center;
}
.numero-entrada :deep(input) {
  text-align: center;
  font-weight: 650;
  font-size: 1.2rem;
}
.numero-boton {
  flex: none;
  width: 54px;
  border-radius: 12px;
  border: 1.5px solid var(--app-borde);
  background: #ffffff;
  color: var(--ion-color-primary);
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.numero-boton:active {
  background: var(--app-primario-suave);
}
.numero-boton:disabled {
  color: var(--app-borde);
  cursor: default;
}
</style>
