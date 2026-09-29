<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/nidos" text="" />
        </ion-buttons>
        <ion-title>{{ nido?.folio ?? 'Nido' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="!nido" class="ion-padding vacio">{{ cargado ? 'No se encontró el nido.' : '' }}</div>

      <template v-else>
        <div class="resumen ion-padding">
          <div class="chips">
            <ion-chip :color="sinAnalisis ? 'warning' : 'success'">
              {{ sinAnalisis ? 'Sin análisis' : 'Análisis registrado' }}
            </ion-chip>
            <ion-chip :color="pendiente ? 'medium' : 'success'">
              {{ pendiente ? 'Por entregar' : 'Entregado' }}
            </ion-chip>
            <ion-chip v-if="nido.deleted" color="danger">Eliminado</ion-chip>
          </div>
          <p>
            {{ nido.especie }} · {{ fechaCorta(nido.fechaMuestreo) }} · Baliza {{ nido.baliza }}<br />
            Emergencia probable: <strong>{{ fechaCorta(derivados!.fechaProbableEmergencia) }}</strong>
          </p>
        </div>

        <div v-if="!nido.deleted" class="acciones ion-padding-horizontal">
          <ion-button expand="block" :router-link="`/nidos/${id}/analisis`">
            <ion-icon slot="start" :icon="flaskOutline" />
            {{ sinAnalisis ? 'Registrar análisis' : 'Editar análisis' }}
          </ion-button>
          <ion-button expand="block" fill="outline" :router-link="`/nidos/${id}/editar`">
            <ion-icon slot="start" :icon="createOutline" />
            Editar puesta
          </ion-button>
        </div>

        <ion-list v-for="seccion in secciones" :key="seccion.titulo" inset>
          <ion-list-header>
            <ion-label>{{ seccion.titulo }}</ion-label>
          </ion-list-header>
          <ion-item v-for="[etiqueta, texto] in seccion.filas" :key="etiqueta">
            <ion-label class="ion-text-wrap">{{ etiqueta }}</ion-label>
            <ion-note slot="end" class="ion-text-wrap">{{ texto }}</ion-note>
          </ion-item>
        </ion-list>

        <div v-if="!nido.deleted" class="ion-padding">
          <ion-button expand="block" fill="clear" color="danger" @click="eliminar">
            <ion-icon slot="start" :icon="trashOutline" />
            Eliminar nido
          </ion-button>
        </div>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/vue';
import { createOutline, flaskOutline, trashOutline } from 'ionicons/icons';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { avisar, confirmar } from '@/composables/useAviso';
import { useLiveQuery } from '@/composables/useLiveQuery';
import { db } from '@/db/database';
import { eliminarNido } from '@/db/repositorio';
import { fechaCorta, fechaHora, valor } from '@/domain/formato';
import { calcularDerivados } from '@/domain/formulas';

const route = useRoute();
const router = useIonRouter();
const id = String(route.params.id);

const cargado = ref(false);
const nido = useLiveQuery(async () => {
  const n = await db.nidos.get(id);
  cargado.value = true;
  return n;
}, undefined);
const pendiente = useLiveQuery(() => db.outbox.where({ nidoId: id }).count(), 0);

const sinAnalisis = computed(() => !nido.value?.analisis.fechaEmergencia);
const derivados = computed(() =>
  nido.value ? calcularDerivados(nido.value.fechaMuestreo, nido.value.analisis) : null,
);

const secciones = computed(() => {
  const n = nido.value;
  const d = derivados.value;
  if (!n || !d) return [];
  const a = n.analisis;
  const ubicacion = `${n.lat}, ${n.lng}`;
  return [
    {
      titulo: 'Datos generales',
      filas: [
        ['Fecha de muestreo', fechaCorta(n.fechaMuestreo)],
        ['Especie', n.especie],
        ['Municipio', n.municipio],
        ['Baliza', String(n.baliza)],
        ['Coordenadas', ubicacion],
        ['Precisión', n.ubicacionManual ? 'Escritas a mano' : valor(n.precisionGps, ' m')],
        ['Observador', n.observador],
      ],
    },
    {
      titulo: 'Nido',
      filas: [
        ['Zona de anidación', n.zonaAnidacion],
        ['Hora de puesta', n.horaPuesta],
        ['Tamaño de la nidada', String(n.tamanioNidada)],
        ['Huevos sembrados', String(n.huevosSembrados)],
        ['Tipo de incubación', n.tipoIncubacion],
        ['Emergencia probable', fechaCorta(d.fechaProbableEmergencia)],
      ],
    },
    {
      titulo: 'Hembra',
      filas: [
        ['Largo curvo', valor(n.hembra.largoCurvoCm, ' cm')],
        ['Ancho curvo', valor(n.hembra.anchoCurvoCm, ' cm')],
        ['Placa', valor(n.hembra.placa)],
        ['Observaciones', valor(n.hembra.observaciones)],
      ],
    },
    {
      titulo: 'Análisis del nido',
      filas: [
        ['Fecha de emergencia', fechaCorta(a.fechaEmergencia)],
        ['Periodo de incubación', valor(d.periodoIncubacion, ' días')],
        ['Huevos eclosionados', valor(a.huevosEclosionados)],
        ['Huevos sin desarrollo', valor(a.huevosSinDesarrollo)],
        ['Con desarrollo aparente', valor(a.huevosConDesarrolloAparente)],
        ['Huevos no eclosionados', valor(d.huevosNoEclosionados)],
        ['Total de huevos', valor(d.totalHuevos)],
        ['Éxito de eclosión', valor(d.exitoEclosion, ' %')],
        ['Crías vivas', valor(a.criasVivas)],
        ['Crías muertas', valor(a.criasMuertas)],
        ['Estatus del análisis', valor(a.estatusAnalisis)],
        ['Pérdida de nidada', valor(a.perdidaNidada)],
        ['Observaciones', valor(a.observacionesNido)],
      ],
    },
    {
      titulo: 'Registro',
      filas: [
        ['Creado', fechaHora(n.createdAt)],
        ['Última modificación', fechaHora(n.updatedAt)],
        ['Versión', String(n.version)],
        ['Teléfono', n.deviceId],
      ],
    },
  ];
});

async function eliminar() {
  const n = nido.value;
  if (!n) return;
  const ok = await confirmar({
    titulo: `¿Eliminar ${n.folio}?`,
    mensaje: 'Dejará de aparecer en la lista. El registro se conserva y el borrado se incluye en la próxima entrega.',
    accion: 'Eliminar',
  });
  if (!ok) return;
  await eliminarNido(n.id);
  await avisar(`Nido ${n.folio} eliminado`, 'medium');
  router.back();
}
</script>

<style scoped>
.resumen p {
  margin: 8px 0 0;
  color: var(--ion-color-medium-shade);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-left: -4px;
}
.acciones {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
ion-note {
  font-size: 0.95rem;
  max-width: 55%;
  text-align: right;
  color: var(--ion-text-color);
}
.vacio {
  text-align: center;
  color: var(--ion-color-medium-shade);
}
</style>
