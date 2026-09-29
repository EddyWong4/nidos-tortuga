<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Nidos</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar v-model="busqueda" placeholder="Folio, especie o baliza" :debounce="150" />
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="filtro">
          <ion-segment-button value="todos">
            <ion-label>Todos ({{ datos.nidos.length }})</ion-label>
          </ion-segment-button>
          <ion-segment-button value="sinAnalisis">
            <ion-label>Sin análisis</ion-label>
          </ion-segment-button>
          <ion-segment-button value="porEntregar">
            <ion-label>Por entregar</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list v-if="visibles.length">
        <ion-item v-for="nido in visibles" :key="nido.id" :router-link="`/nidos/${nido.id}`" detail>
          <ion-label>
            <h2>{{ nido.folio }}</h2>
            <p>{{ nido.especie }} · {{ fechaCorta(nido.fechaMuestreo) }} · Baliza {{ nido.baliza }}</p>
            <div class="etiquetas">
              <ion-badge v-if="!nido.analisis.fechaEmergencia" color="warning">Sin análisis</ion-badge>
              <ion-badge v-if="datos.pendientes.has(nido.id)" color="medium">Por entregar</ion-badge>
            </div>
          </ion-label>
        </ion-item>
      </ion-list>

      <div v-else class="vacio ion-padding">
        <ion-icon :icon="eggOutline" />
        <p v-if="!datos.nidos.length">Aún no hay nidos registrados en este teléfono.</p>
        <p v-else>Ningún nido coincide con la búsqueda.</p>
      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button router-link="/nidos/nuevo" :disabled="requiereInstalacion" aria-label="Nuevo nido">
          <ion-icon :icon="add" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBadge,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { add, eggOutline } from 'ionicons/icons';
import { computed, ref } from 'vue';
import { useInstalacion } from '@/composables/useInstalacion';
import { useLiveQuery } from '@/composables/useLiveQuery';
import { db } from '@/db/database';
import { fechaCorta } from '@/domain/formato';
import type { Nido } from '@/domain/schemas';

const { requiereInstalacion } = useInstalacion();
const busqueda = ref('');
const filtro = ref<'todos' | 'sinAnalisis' | 'porEntregar'>('todos');

const datos = useLiveQuery(
  async () => {
    const [nidos, cambios] = await Promise.all([
      db.nidos.orderBy('updatedAt').reverse().filter((n) => !n.deleted).toArray(),
      db.outbox.toArray(),
    ]);
    return { nidos, pendientes: new Set(cambios.map((c) => c.nidoId)) };
  },
  { nidos: [] as Nido[], pendientes: new Set<string>() },
);

const sinAcentos = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const visibles = computed(() => {
  const q = sinAcentos(busqueda.value.trim());
  return datos.value.nidos.filter((n) => {
    if (filtro.value === 'sinAnalisis' && n.analisis.fechaEmergencia) return false;
    if (filtro.value === 'porEntregar' && !datos.value.pendientes.has(n.id)) return false;
    if (!q) return true;
    return sinAcentos(n.folio).includes(q) || sinAcentos(n.especie).includes(q) || String(n.baliza) === q;
  });
});
</script>

<style scoped>
.etiquetas {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}
.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20%;
  color: var(--ion-color-medium-shade);
  text-align: center;
}
.vacio ion-icon {
  font-size: 4rem;
}
ion-segment-button {
  min-width: 0;
  text-transform: none;
}
</style>
