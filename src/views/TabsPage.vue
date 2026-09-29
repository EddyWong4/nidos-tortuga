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
        <ion-tab-button tab="ajustes" href="/tabs/ajustes">
          <ion-icon :icon="settingsOutline" aria-hidden="true" />
          <ion-label>Ajustes</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonIcon, IonLabel, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue';
import { homeOutline, listOutline, settingsOutline } from 'ionicons/icons';
</script>
