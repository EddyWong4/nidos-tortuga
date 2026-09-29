<template>
  <ion-app>
    <ion-router-outlet />
    <AvisoActualizacion />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import AvisoActualizacion from '@/components/AvisoActualizacion.vue';
</script>
