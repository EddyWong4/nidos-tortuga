<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Coordinación</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <TarjetaSeccion
        titulo="Importar entregas"
        subtitulo="Los archivos que te mandan los observadores (.txt)."
        :icono="downloadOutline"
      >
        <input
          ref="selector"
          type="file"
          accept=".txt,.json,text/plain,application/json"
          multiple
          hidden
          @change="alElegir"
        />
        <ion-button expand="block" :disabled="trabajando" @click="selector?.click()">
          <ion-icon slot="start" :icon="folderOpenOutline" />
          Elegir archivos
        </ion-button>
        <p class="nota">
          Puedes elegir varios a la vez. Importar dos veces el mismo archivo no duplica nada.
        </p>

        <div v-for="r in resultados" :key="r.archivo" class="resultado" :class="{ 'resultado--error': r.error }">
          <strong>{{ r.archivo }}</strong>
          <p v-if="r.error">{{ r.error }}</p>
          <p v-else-if="r.resumen">
            {{ r.resumen.nuevos }} nuevos · {{ r.resumen.actualizados }} actualizados ·
            {{ r.resumen.sinCambios + r.resumen.antiguos }} sin cambios
            <template v-if="r.resumen.conflictos"> · <b class="aviso">{{ r.resumen.conflictos }} por revisar</b></template>
            <template v-if="r.resumen.rechazados.length">
              · <b class="error">{{ r.resumen.rechazados.length }} dañados</b>
              ({{ r.resumen.rechazados.map((x) => x.folio).join(', ') }})
            </template>
          </p>
        </div>
      </TarjetaSeccion>

      <TarjetaSeccion
        v-if="conflictos.length"
        titulo="Por revisar"
        :subtitulo="`${conflictos.length} ${conflictos.length === 1 ? 'nido llegó' : 'nidos llegaron'} con datos que no coinciden.`"
        :icono="gitCompareOutline"
      >
        <div v-for="c in conflictos" :key="c.id" class="conflicto">
          <div class="conflicto-titulo">
            <strong>{{ c.folio }}</strong>
            <span class="motivo">{{ c.motivo === 'folio-duplicado' ? 'Folio repetido en dos nidos' : 'Misma versión, datos distintos' }}</span>
          </div>
          <table class="comparacion">
            <thead>
              <tr>
                <th></th>
                <th>Actual</th>
                <th>Del archivo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="[etiqueta, obtener] in CAMPOS_COMPARAR" :key="etiqueta" :class="{ distinto: obtener(c.actual) !== obtener(c.entrante) }">
                <th>{{ etiqueta }}</th>
                <td>{{ obtener(c.actual) }}</td>
                <td>{{ obtener(c.entrante) }}</td>
              </tr>
            </tbody>
          </table>
          <template v-if="c.motivo === 'folio-duplicado'">
            <p class="explicacion">
              Probablemente son <strong>dos nidos distintos</strong> de teléfonos configurados con el mismo código.
            </p>
            <ion-button expand="block" class="ambos" @click="resolver(c.id!, 'conservarAmbos')">
              <ion-icon slot="start" :icon="copyOutline" />
              Conservar los dos (el del archivo será {{ c.folio }}B)
            </ion-button>
          </template>
          <div class="conflicto-acciones">
            <ion-button fill="outline" @click="resolver(c.id!, 'conservar')">Quedarme con el actual</ion-button>
            <ion-button fill="outline" @click="resolver(c.id!, 'usarEntrante')">Usar el del archivo</ion-button>
          </div>
          <p class="nota">Lo que se reemplace queda guardado en el historial.</p>
        </div>
      </TarjetaSeccion>

      <TarjetaSeccion titulo="Reporte de la temporada" :subtitulo="`${totalNidos} nidos, una fila por nido.`" :icono="gridOutline">
        <div class="reportes">
          <ion-button expand="block" :disabled="!totalNidos || trabajando" @click="exportarExcel">
            <ion-icon slot="start" :icon="documentOutline" />
            Excel (.xlsx)
          </ion-button>
          <ion-button expand="block" fill="outline" :disabled="!totalNidos || trabajando" @click="exportarCSV">
            <ion-icon slot="start" :icon="documentTextOutline" />
            CSV
          </ion-button>
        </div>
        <p class="nota">Incluye los campos calculados: emergencia probable, periodo de incubación, total y éxito de eclosión.</p>
      </TarjetaSeccion>

      <TarjetaSeccion v-if="lotes.length" titulo="Importaciones recientes" :icono="timeOutline">
        <ul class="lotes">
          <li v-for="l in lotes" :key="l.id">
            <span>{{ l.archivo }}</span>
            <small>{{ fechaHora(l.fecha) }} · {{ l.registros }} nidos</small>
          </li>
        </ul>
      </TarjetaSeccion>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import {
  copyOutline,
  documentOutline,
  documentTextOutline,
  downloadOutline,
  folderOpenOutline,
  gitCompareOutline,
  gridOutline,
  timeOutline,
} from 'ionicons/icons';
import { format } from 'date-fns';
import { ref } from 'vue';
import TarjetaSeccion from '@/components/TarjetaSeccion.vue';
import { avisar } from '@/composables/useAviso';
import { useLiveQuery } from '@/composables/useLiveQuery';
import { db, type Conflicto, type Lote, type ResumenImportacion } from '@/db/database';
import { fechaCorta, fechaHora, valor } from '@/domain/formato';
import type { Nido } from '@/domain/schemas';
import { compartirArchivo, leerArchivos } from '@/sync/compartir';
import { importarPaquete, resolverConflicto, type AccionConflicto } from '@/sync/importacion';
import { leerPaquete } from '@/sync/paquete';
import { aCSV, aExcel } from '@/sync/reportes';

const CAMPOS_COMPARAR: [string, (n: Nido) => string][] = [
  ['Observador', (n) => n.observador],
  ['Especie', (n) => n.especie],
  ['Muestreo', (n) => fechaCorta(n.fechaMuestreo)],
  ['Baliza', (n) => String(n.baliza)],
  ['Nidada', (n) => String(n.tamanioNidada)],
  ['Eclosionados', (n) => valor(n.analisis.huevosEclosionados)],
  ['Versión', (n) => String(n.version)],
  ['Modificado', (n) => fechaHora(n.updatedAt)],
];

const selector = ref<HTMLInputElement | null>(null);
const trabajando = ref(false);
const resultados = ref<{ archivo: string; resumen?: ResumenImportacion; error?: string }[]>([]);

const conflictos = useLiveQuery(() => db.conflictos.where('resuelto').equals(0).toArray(), [] as Conflicto[]);
const totalNidos = useLiveQuery(() => db.nidos.filter((n) => !n.deleted).count(), 0);
const lotes = useLiveQuery(
  async () => (await db.lotes.where('origen').equals('importacion').reverse().sortBy('fecha')).slice(0, 10),
  [] as Lote[],
);

async function alElegir(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  trabajando.value = true;
  resultados.value = [];
  try {
    for (const { nombre, texto } of await leerArchivos(input.files)) {
      try {
        const resumen = await importarPaquete(await leerPaquete(texto), nombre);
        resultados.value.push({ archivo: nombre, resumen });
      } catch (err) {
        resultados.value.push({ archivo: nombre, error: err instanceof Error ? err.message : String(err) });
      }
    }
  } finally {
    input.value = '';
    trabajando.value = false;
  }
}

async function resolver(id: number, accion: AccionConflicto) {
  const folio = await resolverConflicto(id, accion);
  const mensajes: Record<AccionConflicto, string> = {
    conservar: 'Se conservó el nido actual',
    usarEntrante: 'Se usó el nido del archivo',
    conservarAmbos: `Se conservaron los dos. El del archivo quedó como ${folio}: avisa al observador para corregir la estaca.`,
  };
  await avisar(mensajes[accion], 'medium');
}

const sufijo = () => format(new Date(), 'yyyy-MM-dd');

async function exportarExcel() {
  trabajando.value = true;
  try {
    const blob = await aExcel(await db.nidos.toArray());
    await compartirArchivo(
      `nidos-${sufijo()}.xlsx`,
      blob,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Reporte de nidos',
    );
  } catch (e) {
    console.error(e);
    await avisar(`No se pudo generar el Excel: ${e instanceof Error ? e.message : e}`, 'danger');
  } finally {
    trabajando.value = false;
  }
}

async function exportarCSV() {
  await compartirArchivo(`nidos-${sufijo()}.csv`, aCSV(await db.nidos.toArray()), 'text/csv', 'Reporte de nidos');
}
</script>

<style scoped>
ion-button {
  margin: 0;
  min-height: 52px;
}
.nota {
  margin: 10px 2px 0;
  font-size: 0.85rem;
  color: var(--app-texto-suave);
}
.resultado {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--app-exito-suave);
  overflow-wrap: anywhere;
}
.resultado--error {
  background: var(--app-error-suave);
  color: var(--ion-color-danger);
}
.resultado p {
  margin: 4px 0 0;
  font-size: 0.9rem;
}
.aviso {
  color: var(--ion-color-warning-shade);
}
.error {
  color: var(--ion-color-danger);
}
.conflicto {
  padding: 14px 0;
  border-top: 1px solid var(--app-borde-suave);
}
.conflicto:first-of-type {
  border-top: 0;
  padding-top: 0;
}
.conflicto-titulo {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}
.conflicto-titulo strong {
  font-size: 1.1rem;
}
.motivo {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ion-color-warning-shade);
}
.comparacion {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.comparacion th,
.comparacion td {
  text-align: left;
  padding: 6px 4px;
  border-bottom: 1px solid var(--app-borde-suave);
  vertical-align: top;
}
.comparacion thead th {
  color: var(--app-texto-suave);
  font-weight: 700;
}
.comparacion tbody th {
  color: var(--app-texto-suave);
  font-weight: 600;
  width: 30%;
}
.comparacion tr.distinto td {
  background: var(--app-aviso-suave);
  font-weight: 700;
}
.explicacion {
  margin: 12px 0 8px;
  font-size: 0.9rem;
}
.ambos {
  white-space: normal;
  margin-bottom: 8px;
}
.conflicto-acciones {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}
.conflicto-acciones ion-button {
  font-size: 0.9rem;
  white-space: normal;
}
.reportes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.lotes {
  list-style: none;
  margin: 0;
  padding: 0;
}
.lotes li {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  border-bottom: 1px solid var(--app-borde-suave);
  overflow-wrap: anywhere;
}
.lotes li:last-child {
  border-bottom: 0;
}
.lotes small {
  color: var(--app-texto-suave);
}
</style>
