<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/inicio" text="" />
        </ion-buttons>
        <ion-title>Entregar datos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <section class="tarjeta estado" :class="{ 'estado--al-dia': !pend.nidos.length }">
        <ion-icon :icon="pend.nidos.length ? cloudUploadOutline : cloudDoneOutline" aria-hidden="true" />
        <div>
          <strong v-if="pend.nidos.length">
            {{ pend.nidos.length }} {{ pend.nidos.length === 1 ? 'nido por entregar' : 'nidos por entregar' }}
          </strong>
          <strong v-else>Todo entregado</strong>
          <p v-if="pend.nidos.length">{{ pend.nidos.map((n) => n.folio).join(', ') }}</p>
          <p v-else>No hay cambios nuevos desde la última entrega.</p>
        </div>
      </section>

      <TarjetaSeccion
        titulo="Enviar al coordinador"
        subtitulo="Se genera un archivo con los nidos nuevos o modificados."
        :icono="shareSocialOutline"
      >
        <ol class="pasos">
          <li>Toca <strong>Generar y compartir</strong>.</li>
          <li>Elige WhatsApp, correo, Drive o Bluetooth y envíalo al coordinador.</li>
          <li>Los nidos quedan como <strong>Entregado</strong>.</li>
        </ol>
        <ion-button expand="block" :disabled="!pend.nidos.length || trabajando" @click="entregar">
          <ion-icon slot="start" :icon="shareOutline" />
          Generar y compartir
        </ion-button>
        <p class="nota">Compartir necesita señal en ese momento. Si no hay, puedes hacerlo después: nada se pierde.</p>
      </TarjetaSeccion>

      <TarjetaSeccion v-if="ultima" titulo="Última entrega" :icono="timeOutline">
        <p class="ultima">
          <strong>{{ fechaHora(ultima.fecha) }}</strong> · {{ ultima.registros }}
          {{ ultima.registros === 1 ? 'nido' : 'nidos' }}<br />
          <small>{{ ultima.archivo }}</small>
        </p>
        <ion-button expand="block" fill="outline" :disabled="trabajando" @click="reenviar">
          <ion-icon slot="start" :icon="repeatOutline" />
          Volver a compartir este archivo
        </ion-button>
      </TarjetaSeccion>

      <TarjetaSeccion v-if="servidor.activo" titulo="Servidor" :icono="serverOutline">
        <p class="ultima">
          <template v-if="estadoSync">
            Última sincronización: <strong>{{ fechaHora(estadoSync.fecha) }}</strong><br />
            <span :class="estadoSync.ok ? 'ok' : 'mal'">{{ estadoSync.mensaje }}</span>
          </template>
          <template v-else>Aún no se ha sincronizado.</template>
        </p>
        <ion-button expand="block" fill="outline" :disabled="trabajando || !pend.nidos.length" @click="sincronizarAhora">
          <ion-icon slot="start" :icon="syncOutline" />
          Sincronizar ahora
        </ion-button>
      </TarjetaSeccion>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import {
  cloudDoneOutline,
  cloudUploadOutline,
  repeatOutline,
  serverOutline,
  shareOutline,
  shareSocialOutline,
  syncOutline,
  timeOutline,
} from 'ionicons/icons';
import { ref } from 'vue';
import TarjetaSeccion from '@/components/TarjetaSeccion.vue';
import { avisar } from '@/composables/useAviso';
import { useLiveQuery } from '@/composables/useLiveQuery';
import { fechaHora } from '@/domain/formato';
import type { Nido } from '@/domain/schemas';
import { compartirArchivo } from '@/sync/compartir';
import { confirmarEntrega, pendientes, prepararEntrega, ultimaEntrega } from '@/sync/entrega';
import { CONFIG_VACIA, leerConfigServidor, leerEstadoSincronizacion, sincronizar } from '@/sync/servidor';

const trabajando = ref(false);
const pend = useLiveQuery(() => pendientes(), { nidos: [] as Nido[], hastaSeq: 0 });
const ultima = useLiveQuery(() => ultimaEntrega(), undefined);
const servidor = useLiveQuery(() => leerConfigServidor(), CONFIG_VACIA);
const estadoSync = useLiveQuery(() => leerEstadoSincronizacion(), null);

async function entregar() {
  trabajando.value = true;
  try {
    const entrega = await prepararEntrega();
    if (!entrega) return;
    const r = await compartirArchivo(entrega.nombreArchivo, entrega.contenido, 'text/plain', 'Entrega de nidos');
    if (r === 'cancelado') {
      await avisar('No se compartió. Los nidos siguen pendientes.', 'medium');
      return;
    }
    await confirmarEntrega(entrega);
    await avisar(
      r === 'compartido'
        ? `Entregados ${entrega.paquete.nidos.length} nidos`
        : `Archivo guardado en Descargas: envíalo al coordinador`,
    );
  } catch (e) {
    console.error(e);
    await avisar(`No se pudo generar la entrega: ${e instanceof Error ? e.message : e}`, 'danger');
  } finally {
    trabajando.value = false;
  }
}

async function reenviar() {
  const l = ultima.value;
  if (!l?.contenido) return;
  await compartirArchivo(l.archivo, l.contenido, 'text/plain', 'Entrega de nidos');
}

async function sincronizarAhora() {
  trabajando.value = true;
  try {
    const r = await sincronizar();
    if (!r) await avisar('Sin señal o sin nada pendiente.', 'medium');
    else await avisar(r.mensaje, r.ok ? 'success' : 'warning');
  } finally {
    trabajando.value = false;
  }
}
</script>

<style scoped>
.estado {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  margin-bottom: 14px;
  border-left: 5px solid var(--ion-color-warning);
}
.estado--al-dia {
  border-left-color: var(--ion-color-success);
}
.estado > ion-icon {
  flex: none;
  font-size: 2rem;
  color: var(--ion-color-warning);
}
.estado--al-dia > ion-icon {
  color: var(--ion-color-success);
}
.estado strong {
  font-size: 1.15rem;
}
.estado p {
  margin: 4px 0 0;
  color: var(--app-texto-suave);
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}
.pasos {
  margin: 0 0 16px;
  padding-left: 1.3rem;
  line-height: 1.5;
}
.nota {
  margin: 10px 2px 0;
  font-size: 0.85rem;
  color: var(--app-texto-suave);
}
.ultima {
  margin: 0 0 12px;
  line-height: 1.5;
}
.ultima small {
  color: var(--app-texto-suave);
  overflow-wrap: anywhere;
}
.ok {
  color: var(--ion-color-success);
  font-weight: 600;
}
.mal {
  color: var(--ion-color-danger);
  font-weight: 600;
}
ion-button {
  margin: 0;
  min-height: 52px;
}
</style>
