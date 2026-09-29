<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Nidos de Tortuga</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <AvisoInstalacion />

      <p v-if="perfil" class="saludo">
        Hola, <strong>{{ perfil.observador }}</strong> · Teléfono {{ perfil.codigoDispositivo }} ·
        Siguiente folio {{ siguienteFolio }}
      </p>

      <div class="conteos">
        <div class="conteo">
          <span class="numero">{{ conteos.total }}</span>
          <span class="etiqueta">Nidos</span>
        </div>
        <div class="conteo">
          <span class="numero">{{ conteos.sinAnalisis }}</span>
          <span class="etiqueta">Sin análisis</span>
        </div>
        <div class="conteo">
          <span class="numero">{{ conteos.porEntregar }}</span>
          <span class="etiqueta">Por entregar</span>
        </div>
      </div>

      <ion-button
        expand="block"
        size="large"
        class="nuevo"
        router-link="/nidos/nuevo"
        :disabled="requiereInstalacion"
      >
        <ion-icon slot="start" :icon="addCircleOutline" />
        Nuevo nido
      </ion-button>

      <template v-if="alertas.length">
        <h2 class="subtitulo">Próximos a emerger</h2>
        <ion-list lines="full" class="alertas">
          <ion-item v-for="a in alertas.slice(0, 5)" :key="a.nido.id" :router-link="`/nidos/${a.nido.id}`" detail>
            <ion-label>
              <h3>{{ a.nido.folio }} · {{ a.nido.especie }}</h3>
              <p>Baliza {{ a.nido.baliza }} · probable {{ fechaCorta(a.fecha) }}</p>
            </ion-label>
            <ion-badge slot="end" :color="a.dias < 0 ? 'danger' : a.dias <= 2 ? 'warning' : 'medium'">
              {{ textoDias(a.dias) }}
            </ion-badge>
          </ion-item>
        </ion-list>
        <p v-if="alertas.length > 5" class="nota">y {{ alertas.length - 5 }} más en la lista de nidos.</p>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { addCircleOutline } from 'ionicons/icons';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import AvisoInstalacion from '@/components/AvisoInstalacion.vue';
import { useInstalacion } from '@/composables/useInstalacion';
import { useLiveQuery } from '@/composables/useLiveQuery';
import { db } from '@/db/database';
import { contarNidos } from '@/db/repositorio';
import { proximosAEmerger } from '@/domain/alertas';
import { formatearFolio } from '@/domain/folio';
import { fechaCorta, hoyISO, textoDias } from '@/domain/formato';
import { usePerfilStore } from '@/stores/perfil';

const { requiereInstalacion } = useInstalacion();
const { perfil } = storeToRefs(usePerfilStore());

const siguienteFolio = computed(() =>
  perfil.value ? formatearFolio(perfil.value.codigoDispositivo, perfil.value.siguienteConsecutivo) : '',
);

const conteos = useLiveQuery(() => contarNidos(), { total: 0, sinAnalisis: 0, porEntregar: 0 });
const alertas = useLiveQuery(async () => proximosAEmerger(await db.nidos.toArray(), hoyISO()), []);
</script>

<style scoped>
.saludo {
  margin: 0 0 12px;
  color: var(--ion-color-medium-shade);
  font-size: 0.9rem;
}
.conteos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}
.conteo {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 4px;
  border-radius: 12px;
  background: var(--ion-color-light);
}
.numero {
  font-size: 2rem;
  font-weight: 700;
  color: var(--ion-color-primary);
}
.etiqueta {
  font-size: 0.875rem;
  color: var(--ion-color-medium-shade);
}
.nuevo {
  --border-radius: 12px;
}
.subtitulo {
  font-size: 1.1rem;
  margin: 28px 0 8px;
}
.alertas {
  border-radius: 12px;
}
.nota {
  color: var(--ion-color-medium-shade);
  font-size: 0.875rem;
}
</style>
