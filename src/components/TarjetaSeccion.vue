<template>
  <section class="tarjeta seccion">
    <header v-if="titulo" class="seccion-cabecera">
      <span v-if="icono" class="seccion-icono"><ion-icon :icon="icono" aria-hidden="true" /></span>
      <div>
        <h2 class="seccion-titulo">{{ titulo }}</h2>
        <p v-if="subtitulo" class="seccion-subtitulo">{{ subtitulo }}</p>
      </div>
    </header>
    <slot />
  </section>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';

defineProps<{ titulo?: string; subtitulo?: string; icono?: string }>();
</script>

<style scoped>
.seccion {
  padding: 16px;
  margin-bottom: 14px;
}
.seccion-cabecera {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.seccion-icono {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--app-primario-suave);
  color: var(--ion-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
}
.seccion-titulo {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--app-texto);
}
.seccion-subtitulo {
  margin: 2px 0 0;
  font-size: 0.875rem;
  color: var(--app-texto-suave);
}
</style>
