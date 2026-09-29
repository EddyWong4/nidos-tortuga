<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Nidos</ion-title>
      </ion-toolbar>
      <ion-toolbar class="barra-filtros">
        <ion-searchbar
          v-model="busqueda"
          class="buscador"
          placeholder="Buscar folio, especie o baliza"
          :debounce="150"
        />
        <div class="filtros" role="tablist">
          <button
            v-for="f in FILTROS"
            :key="f.valor"
            type="button"
            role="tab"
            class="filtro"
            :class="{ 'filtro--activo': filtro === f.valor }"
            :aria-selected="filtro === f.valor"
            @click="filtro = f.valor"
          >
            {{ f.texto }}
            <span class="filtro-cuenta">{{ cuentas[f.valor] }}</span>
          </button>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <router-link v-for="nido in visibles" :key="nido.id" :to="`/nidos/${nido.id}`" class="tarjeta nido">
        <span class="nido-barra" :style="{ background: colorEspecie(nido.especie) }" />
        <span class="nido-cuerpo">
          <span class="nido-cabecera">
            <strong class="nido-folio">{{ nido.folio }}</strong>
            <span class="nido-especie">
              <span class="punto" :style="{ background: colorEspecie(nido.especie) }" />
              {{ nido.especie }}
            </span>
          </span>
          <span class="nido-detalle">
            {{ fechaCorta(nido.fechaMuestreo) }} · Baliza {{ nido.baliza }} · {{ nido.tamanioNidada }} huevos
          </span>
          <span class="nido-etiquetas">
            <span v-if="!nido.analisis.fechaEmergencia" class="etiqueta etiqueta--aviso">
              <ion-icon :icon="flaskOutline" aria-hidden="true" /> Sin análisis
            </span>
            <span v-else class="etiqueta etiqueta--ok">
              <ion-icon :icon="checkmarkCircle" aria-hidden="true" /> Analizado
            </span>
            <span v-if="datos.pendientes.has(nido.id)" class="etiqueta">
              <ion-icon :icon="cloudUploadOutline" aria-hidden="true" /> Por entregar
            </span>
          </span>
        </span>
        <ion-icon :icon="chevronForward" class="nido-flecha" aria-hidden="true" />
      </router-link>

      <div v-if="!visibles.length" class="vacio">
        <ion-icon :icon="datos.nidos.length ? searchOutline : eggOutline" aria-hidden="true" />
        <p v-if="!datos.nidos.length">
          Aún no hay nidos en este teléfono.<br />Toca <strong>+</strong> para registrar el primero.
        </p>
        <p v-else>Ningún nido coincide con la búsqueda o el filtro.</p>
      </div>
      <!-- Espacio para que el botón + no tape la última tarjeta -->
      <div class="espacio-fab" />

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button router-link="/nidos/nuevo" :disabled="requiereInstalacion" aria-label="Registrar nuevo nido">
          <ion-icon :icon="add" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import {
  add,
  checkmarkCircle,
  chevronForward,
  cloudUploadOutline,
  eggOutline,
  flaskOutline,
  searchOutline,
} from 'ionicons/icons';
import { computed, ref } from 'vue';
import { useInstalacion } from '@/composables/useInstalacion';
import { useLiveQuery } from '@/composables/useLiveQuery';
import { db } from '@/db/database';
import { fechaCorta } from '@/domain/formato';
import type { Nido } from '@/domain/schemas';
import { colorEspecie } from '@/ui/colores';

type Filtro = 'todos' | 'sinAnalisis' | 'porEntregar';
const FILTROS: { valor: Filtro; texto: string }[] = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'sinAnalisis', texto: 'Sin análisis' },
  { valor: 'porEntregar', texto: 'Por entregar' },
];

const { requiereInstalacion } = useInstalacion();
const busqueda = ref('');
const filtro = ref<Filtro>('todos');

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

const cumpleFiltro = (n: Nido, f: Filtro) =>
  f === 'todos' ||
  (f === 'sinAnalisis' && !n.analisis.fechaEmergencia) ||
  (f === 'porEntregar' && datos.value.pendientes.has(n.id));

const cuentas = computed(() => ({
  todos: datos.value.nidos.length,
  sinAnalisis: datos.value.nidos.filter((n) => cumpleFiltro(n, 'sinAnalisis')).length,
  porEntregar: datos.value.nidos.filter((n) => cumpleFiltro(n, 'porEntregar')).length,
}));

const sinAcentos = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const visibles = computed(() => {
  const q = sinAcentos(busqueda.value.trim());
  return datos.value.nidos.filter((n) => {
    if (!cumpleFiltro(n, filtro.value)) return false;
    if (!q) return true;
    return sinAcentos(n.folio).includes(q) || sinAcentos(n.especie).includes(q) || String(n.baliza) === q;
  });
});
</script>

<style scoped>
.barra-filtros {
  --padding-top: 6px;
  --padding-bottom: 10px;
}
.buscador {
  --background: var(--ion-background-color);
  --border-radius: 12px;
  --box-shadow: none;
  --placeholder-color: #6b7a76;
  --placeholder-opacity: 1;
  padding: 0 8px 8px;
  min-height: 0;
}
.filtros {
  display: flex;
  gap: 6px;
  padding: 0 10px;
  overflow-x: auto;
}
.filtro {
  flex: 1 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1.5px solid var(--app-borde);
  background: #ffffff;
  color: var(--app-texto);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}
.filtro--activo {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
  color: #ffffff;
}
.filtro-cuenta {
  min-width: 22px;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--ion-background-color);
  color: var(--app-texto);
  font-size: 0.8rem;
}
.filtro--activo .filtro-cuenta {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}
.nido {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px 14px 0;
  margin-bottom: 10px;
  overflow: hidden;
  text-decoration: none;
  color: var(--app-texto);
}
.nido:active {
  background: var(--app-primario-suave);
}
.nido-barra {
  align-self: stretch;
  width: 6px;
  margin: -14px 0;
}
.nido-cuerpo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.nido-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.nido-folio {
  font-size: 1.15rem;
  font-weight: 800;
}
.nido-especie {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 650;
  font-size: 0.95rem;
}
.punto {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.nido-detalle {
  font-size: 0.9rem;
  color: var(--app-texto-suave);
}
.nido-etiquetas {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}
.etiqueta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  background: var(--ion-background-color);
  color: var(--app-texto-suave);
}
.etiqueta--aviso {
  background: var(--app-aviso-suave);
  color: var(--ion-color-warning-shade);
}
.etiqueta--ok {
  background: var(--app-exito-suave);
  color: var(--ion-color-success-shade);
}
.nido-flecha {
  flex: none;
  color: var(--app-borde);
  font-size: 1.3rem;
}
.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-top: 25%;
  color: var(--app-texto-suave);
  line-height: 1.5;
}
.vacio ion-icon {
  font-size: 3.5rem;
  color: var(--app-borde);
}
.espacio-fab {
  height: 80px;
}
ion-fab-button {
  --box-shadow: 0 6px 16px rgba(15, 118, 110, 0.35);
  width: 64px;
  height: 64px;
}
ion-fab {
  margin-bottom: env(safe-area-inset-bottom);
}
</style>
