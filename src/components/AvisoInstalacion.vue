<template>
  <ion-card v-if="requiereInstalacion" color="warning">
    <ion-card-header>
      <ion-card-title>Instala la app para no perder datos</ion-card-title>
    </ion-card-header>
    <ion-card-content>
      <p>En iPhone la captura solo funciona con la app instalada en la pantalla de inicio.</p>
      <ol>
        <li>Toca el botón <strong>Compartir</strong> de Safari (cuadro con flecha hacia arriba).</li>
        <li>Elige <strong>Agregar a pantalla de inicio</strong>.</li>
        <li>Abre la app desde el ícono nuevo.</li>
      </ol>
    </ion-card-content>
  </ion-card>

  <ion-card v-else-if="puedeInstalar">
    <ion-card-content class="instalar">
      <p>Instala la app para abrirla sin internet desde tu pantalla de inicio.</p>
      <ion-button expand="block" @click="instalar">Instalar app</ion-button>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/vue';
import { useInstalacion } from '@/composables/useInstalacion';

const { requiereInstalacion, puedeInstalar, instalar } = useInstalacion();
</script>

<style scoped>
ol {
  padding-left: 1.25rem;
  margin: 0.5rem 0 0;
}
li {
  margin-bottom: 0.25rem;
}
.instalar p {
  margin-top: 0;
}
</style>
