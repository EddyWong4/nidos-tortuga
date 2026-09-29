<template>
  <ion-app>
    <ion-router-outlet />
    <AvisoActualizacion />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted, onUnmounted } from 'vue';
import AvisoActualizacion from '@/components/AvisoActualizacion.vue';
import { asegurarRespaldoDiario } from '@/sync/respaldos';
import { sincronizar } from '@/sync/servidor';

// Tareas de fondo: respaldo diario y, si hay servidor configurado, envío al recuperar la señal.
const CADA_5_MIN = 5 * 60 * 1000;
let temporizador: ReturnType<typeof setInterval> | undefined;
const alVolverLaSenal = () => void sincronizar();

onMounted(() => {
  void asegurarRespaldoDiario().catch((e) => console.error('No se pudo crear el respaldo diario', e));
  void sincronizar();
  window.addEventListener('online', alVolverLaSenal);
  temporizador = setInterval(() => void sincronizar(), CADA_5_MIN);
});

onUnmounted(() => {
  window.removeEventListener('online', alVolverLaSenal);
  clearInterval(temporizador);
});
</script>
