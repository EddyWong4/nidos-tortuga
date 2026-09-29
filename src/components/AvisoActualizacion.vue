<template>
  <ion-toast
    :is-open="needRefresh"
    message="Hay una versión nueva de la app."
    position="top"
    :buttons="botones"
    @did-dismiss="needRefresh = false"
  />
</template>

<script setup lang="ts">
import { IonToast } from '@ionic/vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';

// Nunca recargamos solos: el usuario actualiza cuando termina lo que está capturando.
const { needRefresh, updateServiceWorker } = useRegisterSW();

const botones = [
  { text: 'Después', role: 'cancel' },
  { text: 'Actualizar', handler: () => updateServiceWorker(true) },
];
</script>
