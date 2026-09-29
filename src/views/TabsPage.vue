<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="inicio" href="/tabs/inicio">
          <ion-icon :icon="homeOutline" aria-hidden="true" />
          <ion-label>Inicio</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="nidos" href="/tabs/nidos">
          <ion-icon :icon="listOutline" aria-hidden="true" />
          <ion-label>Nidos</ion-label>
        </ion-tab-button>
        <ion-tab-button v-if="esCoordinador" tab="coordinacion" href="/tabs/coordinacion">
          <ion-icon :icon="peopleOutline" aria-hidden="true" />
          <ion-label>Coordinación</ion-label>
          <ion-badge v-if="conflictos" color="warning">{{ conflictos }}</ion-badge>
        </ion-tab-button>
        <ion-tab-button tab="ajustes" href="/tabs/ajustes">
          <ion-icon :icon="settingsOutline" aria-hidden="true" />
          <ion-label>Ajustes</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonBadge, IonIcon, IonLabel, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue';
import { homeOutline, listOutline, peopleOutline, settingsOutline } from 'ionicons/icons';
import { computed } from 'vue';
import { useLiveQuery } from '@/composables/useLiveQuery';
import { db } from '@/db/database';
import { usePerfilStore } from '@/stores/perfil';

const store = usePerfilStore();
const esCoordinador = computed(() => store.perfil?.rol === 'coordinador');
const conflictos = useLiveQuery(() => db.conflictos.where('resuelto').equals(0).count(), 0);
</script>
