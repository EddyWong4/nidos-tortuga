<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Ajustes</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list v-if="perfil">
        <ion-list-header>
          <ion-label>Perfil</ion-label>
        </ion-list-header>
        <ion-item>
          <ion-label>Observador</ion-label>
          <ion-note slot="end">{{ perfil.observador }}</ion-note>
        </ion-item>
        <ion-item>
          <ion-label>Brigada</ion-label>
          <ion-note slot="end">{{ perfil.brigada }}</ion-note>
        </ion-item>
        <ion-item>
          <ion-label>Código del teléfono</ion-label>
          <ion-note slot="end">{{ perfil.codigoDispositivo }}</ion-note>
        </ion-item>
        <ion-item>
          <ion-label>Rol</ion-label>
          <ion-note slot="end">{{ perfil.rol === 'coordinador' ? 'Coordinador' : 'Observador' }}</ion-note>
        </ion-item>
        <ion-item button router-link="/configuracion" detail>
          <ion-label color="primary">Editar perfil</ion-label>
        </ion-item>
      </ion-list>

      <ion-list>
        <ion-list-header>
          <ion-label>Este teléfono</ion-label>
        </ion-list-header>
        <ion-item>
          <ion-label>App instalada</ion-label>
          <ion-note slot="end">{{ instalada ? 'Sí' : 'No' }}</ion-note>
        </ion-item>
        <ion-item>
          <ion-label>Almacenamiento protegido</ion-label>
          <ion-note slot="end" :color="almacenamiento?.persistente ? 'success' : 'warning'">
            {{ almacenamiento == null ? '…' : almacenamiento.persistente ? 'Sí' : 'No' }}
          </ion-note>
        </ion-item>
        <ion-item>
          <ion-label>Espacio usado</ion-label>
          <ion-note slot="end">{{ espacio }}</ion-note>
        </ion-item>
        <ion-item>
          <ion-label>Conexión</ion-label>
          <ion-note slot="end">{{ enLinea ? 'Con internet' : 'Sin internet' }}</ion-note>
        </ion-item>
      </ion-list>

      <ion-list>
        <ion-list-header>
          <ion-label>Acerca de</ion-label>
        </ion-list-header>
        <ion-item>
          <ion-label>Versión</ion-label>
          <ion-note slot="end">{{ version }}</ion-note>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { estadoAlmacenamiento, type EstadoAlmacenamiento } from '@/composables/useAlmacenamiento';
import { useInstalacion } from '@/composables/useInstalacion';
import { storeToRefs } from 'pinia';
import { usePerfilStore } from '@/stores/perfil';

const version = __APP_VERSION__;
const { perfil } = storeToRefs(usePerfilStore());
const { instalada } = useInstalacion();

const almacenamiento = ref<EstadoAlmacenamiento | null>(null);
onIonViewWillEnter(async () => {
  almacenamiento.value = await estadoAlmacenamiento();
});

const espacio = computed(() => {
  const a = almacenamiento.value;
  if (!a || a.usadoMB == null) return '…';
  return a.disponibleMB == null ? `${a.usadoMB} MB` : `${a.usadoMB} MB de ${a.disponibleMB} MB`;
});

const enLinea = ref(navigator.onLine);
const actualizarConexion = () => (enLinea.value = navigator.onLine);
onMounted(() => {
  window.addEventListener('online', actualizarConexion);
  window.addEventListener('offline', actualizarConexion);
});
onUnmounted(() => {
  window.removeEventListener('online', actualizarConexion);
  window.removeEventListener('offline', actualizarConexion);
});
</script>
