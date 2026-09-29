<template>
  <ion-textarea
    class="notas"
    fill="outline"
    :value="modelValue"
    :placeholder="ejemplo"
    :aria-label="etiqueta"
    :auto-grow="true"
    :rows="3"
    :counter="true"
    :maxlength="maximo"
    @ion-input="emit('update:modelValue', String($event.detail.value ?? ''))"
  />
</template>

<script setup lang="ts">
import { IonTextarea } from '@ionic/vue';

withDefaults(defineProps<{ modelValue: string; etiqueta: string; ejemplo?: string; maximo?: number }>(), {
  maximo: 200,
});
const emit = defineEmits<{ 'update:modelValue': [valor: string] }>();
</script>

<style scoped>
.notas {
  --background: #ffffff;
  --border-color: var(--app-borde);
  --border-width: 1.5px;
  --border-radius: 12px;
  --highlight-color-focused: var(--ion-color-primary);
  --padding-start: 14px;
  --padding-end: 14px;
  --placeholder-color: #7d8c88;
  --placeholder-opacity: 1;
  font-size: 1.0625rem;
}
</style>
