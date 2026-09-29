<template>
  <div class="campo" :class="{ 'campo--error': error }">
    <div class="campo-cabecera">
      <span :id="idEtiqueta" class="campo-etiqueta">{{ etiqueta }}</span>
      <span v-if="opcional" class="campo-opcional">Opcional</span>
    </div>
    <slot :id-etiqueta="idEtiqueta" />
    <p v-if="error" class="campo-error" role="alert">
      <ion-icon :icon="alertCircle" aria-hidden="true" />
      <span>{{ error }}</span>
    </p>
    <p v-else-if="ayuda" class="campo-ayuda">{{ ayuda }}</p>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { alertCircle } from 'ionicons/icons';

defineProps<{
  etiqueta: string;
  opcional?: boolean;
  ayuda?: string;
  error?: string;
}>();

const idEtiqueta = `etq-${Math.random().toString(36).slice(2, 9)}`;
</script>

<style scoped>
.campo {
  margin-bottom: 20px;
  min-width: 0;
}
.campo:last-child {
  margin-bottom: 0;
}
.campo-cabecera {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.campo-etiqueta {
  font-size: 1rem;
  font-weight: 650;
  color: var(--app-texto);
}
.campo-opcional {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--app-texto-suave);
  background: var(--ion-background-color);
  border-radius: 999px;
  padding: 2px 8px;
}
.campo-ayuda,
.campo-error {
  margin: 6px 2px 0;
  font-size: 0.875rem;
  line-height: 1.35;
}
.campo-ayuda {
  color: var(--app-texto-suave);
}
.campo-error {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  color: var(--ion-color-danger);
  font-weight: 600;
}
.campo-error ion-icon {
  flex: none;
  font-size: 1.1rem;
}
</style>
