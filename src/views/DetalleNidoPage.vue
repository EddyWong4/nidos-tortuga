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

    <ion-content class="ion-padding">
      <div v-if="!nido" class="vacio">{{ cargado ? 'No se encontró el nido.' : '' }}</div>

      <template v-else>
        <section class="tarjeta cabecera">
          <span class="cabecera-barra" :style="{ background: colorEspecie(nido.especie) }" />
          <div class="cabecera-cuerpo">
            <div class="cabecera-titulo">
              <h1>{{ nido.folio }}</h1>
              <span class="especie">
                <span class="punto" :style="{ background: colorEspecie(nido.especie) }" />
                {{ nido.especie }}
              </span>
            </div>
            <p>{{ fechaCorta(nido.fechaMuestreo) }} · {{ nido.municipio }} · Baliza {{ nido.baliza }}</p>
            <div class="etiquetas">
              <span v-if="nido.deleted" class="etiqueta etiqueta--error">Eliminado</span>
              <span v-if="sinAnalisis" class="etiqueta etiqueta--aviso">
                <ion-icon :icon="flaskOutline" aria-hidden="true" /> Sin análisis
              </span>
              <span v-else class="etiqueta etiqueta--ok">
                <ion-icon :icon="checkmarkCircle" aria-hidden="true" /> Analizado
              </span>
              <span class="etiqueta">
                <ion-icon :icon="pendiente ? cloudUploadOutline : cloudDoneOutline" aria-hidden="true" />
                {{ pendiente ? 'Por entregar' : 'Entregado' }}
              </span>
            </div>
          </div>
        </section>

        <div class="destacados">
          <div class="tarjeta destacado">
            <span>Emergencia probable</span>
            <strong>{{ fechaCorta(derivados!.fechaProbableEmergencia) }}</strong>
          </div>
          <div class="tarjeta destacado">
            <span>Éxito de eclosión</span>
            <strong>{{ valor(derivados!.exitoEclosion, ' %') }}</strong>
          </div>
        </div>

        <div v-if="!nido.deleted" class="acciones">
          <ion-button expand="block" :router-link="`/nidos/${id}/analisis`">
            <ion-icon slot="start" :icon="flaskOutline" />
            {{ sinAnalisis ? 'Registrar análisis' : 'Editar análisis' }}
          </ion-button>
          <ion-button expand="block" fill="outline" :router-link="`/nidos/${id}/editar`">
            <ion-icon slot="start" :icon="createOutline" />
            Editar puesta
          </ion-button>
        </div>

        <TarjetaSeccion v-for="s in secciones" :key="s.titulo" :titulo="s.titulo" :icono="s.icono">
          <dl class="datos">
            <div v-for="[etiqueta, texto] in s.filas" :key="etiqueta" class="dato" :class="{ 'dato--vacio': texto === '—' }">
              <dt>{{ etiqueta }}</dt>
              <dd>{{ texto }}</dd>
            </div>
          </dl>
        </TarjetaSeccion>

        <ion-button v-if="!nido.deleted" expand="block" fill="clear" color="danger" class="eliminar" @click="eliminar">
          <ion-icon slot="start" :icon="trashOutline" />
          Eliminar nido
        </ion-button>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/vue';
import {
  bodyOutline,
  checkmarkCircle,
  cloudDoneOutline,
  cloudUploadOutline,
  createOutline,
  documentTextOutline,
  eggOutline,
  flaskOutline,
  locationOutline,
  trashOutline,
} from 'ionicons/icons';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import TarjetaSeccion from '@/components/TarjetaSeccion.vue';
import { avisar, confirmar } from '@/composables/useAviso';
import { useLiveQuery } from '@/composables/useLiveQuery';
import { db } from '@/db/database';
import { eliminarNido } from '@/db/repositorio';
import { fechaCorta, fechaHora, valor } from '@/domain/formato';
import { calcularDerivados } from '@/domain/formulas';
import { colorEspecie } from '@/ui/colores';

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
  return [
    {
      titulo: 'Ubicación',
      icono: locationOutline,
      filas: [
        ['Latitud', String(n.lat)],
        ['Longitud', String(n.lng)],
        ['Precisión', n.ubicacionManual ? 'Escrita a mano' : valor(n.precisionGps, ' m')],
        ['Municipio', n.municipio],
        ['Baliza', String(n.baliza)],
        ['Zona', n.zonaAnidacion],
      ],
    },
    {
      titulo: 'Puesta',
      icono: eggOutline,
      filas: [
        ['Fecha de muestreo', fechaCorta(n.fechaMuestreo)],
        ['Hora de puesta', n.horaPuesta],
        ['Tamaño de la nidada', String(n.tamanioNidada)],
        ['Huevos sembrados', String(n.huevosSembrados)],
        ['Incubación', n.tipoIncubacion],
        ['Emergencia probable', fechaCorta(d.fechaProbableEmergencia)],
      ],
    },
    {
      titulo: 'Hembra',
      icono: bodyOutline,
      filas: [
        ['Largo curvo', valor(n.hembra.largoCurvoCm, ' cm')],
        ['Ancho curvo', valor(n.hembra.anchoCurvoCm, ' cm')],
        ['Placa', valor(n.hembra.placa)],
        ['Observaciones', valor(n.hembra.observaciones)],
      ],
    },
    {
      titulo: 'Análisis del nido',
      icono: flaskOutline,
      filas: [
        ['Fecha de emergencia', fechaCorta(a.fechaEmergencia)],
        ['Días de incubación', valor(d.periodoIncubacion)],
        ['Eclosionados', valor(a.huevosEclosionados)],
        ['Sin desarrollo', valor(a.huevosSinDesarrollo)],
        ['Desarrollo aparente', valor(a.huevosConDesarrolloAparente)],
        ['No eclosionados', valor(d.huevosNoEclosionados)],
        ['Total de huevos', valor(d.totalHuevos)],
        ['Éxito de eclosión', valor(d.exitoEclosion, ' %')],
        ['Crías vivas', valor(a.criasVivas)],
        ['Crías muertas', valor(a.criasMuertas)],
        ['Estatus', valor(a.estatusAnalisis)],
        ['Pérdida de nidada', valor(a.perdidaNidada)],
        ['Observaciones', valor(a.observacionesNido)],
      ],
    },
    {
      titulo: 'Registro',
      icono: documentTextOutline,
      filas: [
        ['Observador', n.observador],
        ['Teléfono', n.deviceId],
        ['Creado', fechaHora(n.createdAt)],
        ['Modificado', fechaHora(n.updatedAt)],
        ['Versión', String(n.version)],
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
.cabecera {
  display: flex;
  overflow: hidden;
  margin-bottom: 12px;
}
.cabecera-barra {
  width: 6px;
  flex: none;
}
.cabecera-cuerpo {
  flex: 1;
  padding: 16px;
}
.cabecera-titulo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.cabecera h1 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
}
.cabecera p {
  margin: 4px 0 10px;
  color: var(--app-texto-suave);
}
.especie {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
}
.punto {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.etiquetas {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.etiqueta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.85rem;
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
.etiqueta--error {
  background: var(--app-error-suave);
  color: var(--ion-color-danger);
}
.destacados {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}
.destacado {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.destacado span {
  font-size: 0.8rem;
  color: var(--app-texto-suave);
  font-weight: 600;
}
.destacado strong {
  font-size: 1.15rem;
  color: var(--ion-color-primary-shade);
}
.acciones {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}
.acciones ion-button {
  margin: 0;
  min-height: 52px;
  font-size: 1.05rem;
}
.datos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 12px;
  margin: 0;
}
.dato {
  min-width: 0;
}
.dato dt {
  font-size: 0.8rem;
  color: var(--app-texto-suave);
  font-weight: 600;
  margin-bottom: 2px;
}
.dato dd {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  overflow-wrap: anywhere;
}
.dato--vacio dd {
  color: var(--app-borde);
}
.eliminar {
  margin-top: 4px;
}
.vacio {
  text-align: center;
  color: var(--app-texto-suave);
  margin-top: 30%;
}
</style>
