<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Ajustes</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <TarjetaSeccion v-if="perfil" titulo="Perfil" :icono="personOutline">
        <dl class="datos">
          <div><dt>Observador</dt><dd>{{ perfil.observador }}</dd></div>
          <div><dt>Brigada</dt><dd>{{ perfil.brigada }}</dd></div>
          <div><dt>Teléfono</dt><dd>{{ perfil.codigoDispositivo }}</dd></div>
          <div><dt>Rol</dt><dd>{{ perfil.rol === 'coordinador' ? 'Coordinador' : 'Observador' }}</dd></div>
        </dl>
        <ion-button expand="block" fill="outline" router-link="/configuracion">
          <ion-icon slot="start" :icon="createOutline" />
          Editar perfil
        </ion-button>
      </TarjetaSeccion>

      <TarjetaSeccion
        titulo="Respaldos"
        subtitulo="Cada día se guarda una copia completa dentro del teléfono (las últimas 7)."
        :icono="shieldCheckmarkOutline"
      >
        <ul v-if="respaldos.length" class="respaldos">
          <li v-for="r in respaldos" :key="r.id">
            <span>
              <strong>{{ fechaHora(r.fecha) }}</strong>
              <small>{{ r.registros }} nidos</small>
            </span>
            <ion-button fill="clear" size="small" aria-label="Guardar este respaldo en un archivo" @click="guardarRespaldo(r)">
              <ion-icon slot="icon-only" :icon="shareOutline" />
            </ion-button>
            <ion-button fill="clear" size="small" aria-label="Restaurar este respaldo" @click="restaurar(r.contenido, 'respaldo del ' + fechaHora(r.fecha))">
              <ion-icon slot="icon-only" :icon="refreshOutline" />
            </ion-button>
          </li>
        </ul>
        <p v-else class="nota">Aún no hay respaldos: se crean solos cuando hay nidos.</p>
        <div class="botones">
          <ion-button expand="block" :disabled="trabajando" @click="respaldoCompletoAArchivo">
            <ion-icon slot="start" :icon="downloadOutline" />
            Copia completa a un archivo
          </ion-button>
          <ion-button expand="block" fill="outline" :disabled="trabajando" @click="selector?.click()">
            <ion-icon slot="start" :icon="folderOpenOutline" />
            Restaurar desde archivo
          </ion-button>
        </div>
        <input ref="selector" type="file" accept=".txt,.json,text/plain,application/json" hidden @change="restaurarDeArchivo" />
        <p class="nota">Restaurar agrega lo que falte y nunca borra ni reemplaza datos más nuevos.</p>
      </TarjetaSeccion>

      <TarjetaSeccion titulo="Compartir la app" subtitulo="Que otra persona escanee el código con su cámara." :icono="qrCodeOutline">
        <div class="qr">
          <img v-if="qr" :src="qr" alt="Código QR con la dirección de la app" />
          <p>{{ URL_APP }}</p>
        </div>
        <ion-button expand="block" fill="outline" @click="copiarEnlace">
          <ion-icon slot="start" :icon="copyOutline" />
          Copiar enlace
        </ion-button>
      </TarjetaSeccion>

      <TarjetaSeccion
        titulo="Servidor de sincronización"
        subtitulo="Opcional. Envía los datos solos cuando haya señal."
        :icono="serverOutline"
      >
        <ion-toggle v-model="servidor.activo" label-placement="start" justify="space-between" class="interruptor">
          Enviar al servidor
        </ion-toggle>
        <template v-if="servidor.activo">
          <CampoForm etiqueta="Dirección del servidor" ayuda="La da quien administra el servidor.">
            <EntradaTexto v-model="servidor.url" etiqueta="Dirección del servidor" ejemplo="https://nidos.ejemplo.org" mayusculas="off" />
          </CampoForm>
          <CampoForm etiqueta="Token de este teléfono">
            <EntradaTexto v-model="servidor.token" etiqueta="Token de este teléfono" ejemplo="Pégalo aquí" mayusculas="off" />
          </CampoForm>
          <p v-if="estadoSync" class="nota">
            Última sincronización: {{ fechaHora(estadoSync.fecha) }} ·
            <span :class="estadoSync.ok ? 'ok' : 'mal'">{{ estadoSync.mensaje }}</span>
          </p>
        </template>
        <div class="botones">
          <ion-button expand="block" :disabled="trabajando" @click="guardarServidor">Guardar</ion-button>
          <ion-button v-if="servidor.activo" expand="block" fill="outline" :disabled="trabajando || !servidor.url" @click="probarServidor">
            Probar conexión
          </ion-button>
        </div>
      </TarjetaSeccion>

      <TarjetaSeccion titulo="Este teléfono" :icono="phonePortraitOutline">
        <dl class="datos">
          <div><dt>App instalada</dt><dd>{{ instalada ? 'Sí' : 'No' }}</dd></div>
          <div>
            <dt>Almacenamiento protegido</dt>
            <dd :class="almacenamiento?.persistente ? 'ok' : 'mal'">
              {{ almacenamiento == null ? '…' : almacenamiento.persistente ? 'Sí' : 'No' }}
            </dd>
          </div>
          <div><dt>Espacio usado</dt><dd>{{ espacio }}</dd></div>
          <div><dt>Conexión</dt><dd>{{ enLinea ? 'Con internet' : 'Sin internet' }}</dd></div>
          <div><dt>Versión</dt><dd>{{ version }}</dd></div>
        </dl>
        <ion-button expand="block" fill="outline" router-link="/ayuda">
          <ion-icon slot="start" :icon="helpCircleOutline" />
          Ayuda e instalación
        </ion-button>
      </TarjetaSeccion>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToggle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import {
  copyOutline,
  createOutline,
  downloadOutline,
  folderOpenOutline,
  helpCircleOutline,
  personOutline,
  phonePortraitOutline,
  qrCodeOutline,
  refreshOutline,
  serverOutline,
  shareOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { format } from 'date-fns';
import { storeToRefs } from 'pinia';
import QRCode from 'qrcode';
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import TarjetaSeccion from '@/components/TarjetaSeccion.vue';
import CampoForm from '@/components/form/CampoForm.vue';
import EntradaTexto from '@/components/form/EntradaTexto.vue';
import { avisar, confirmar } from '@/composables/useAviso';
import { estadoAlmacenamiento, type EstadoAlmacenamiento } from '@/composables/useAlmacenamiento';
import { useInstalacion } from '@/composables/useInstalacion';
import { useLiveQuery } from '@/composables/useLiveQuery';
import { db, type Respaldo } from '@/db/database';
import { fechaHora } from '@/domain/formato';
import { usePerfilStore } from '@/stores/perfil';
import { compartirArchivo, leerArchivos } from '@/sync/compartir';
import { armarPaqueteDe } from '@/sync/entrega';
import { importarPaquete } from '@/sync/importacion';
import { leerPaquete } from '@/sync/paquete';
import {
  ApiAdapter,
  CONFIG_VACIA,
  guardarConfigServidor,
  leerConfigServidor,
  leerEstadoSincronizacion,
  sincronizar,
} from '@/sync/servidor';
import { URL_APP } from '@/ui/app';

const version = __APP_VERSION__;
const { instalada } = useInstalacion();
const { perfil } = storeToRefs(usePerfilStore());
const trabajando = ref(false);
const selector = ref<HTMLInputElement | null>(null);

// ---------- Respaldos ----------
const respaldos = useLiveQuery(async () => (await db.respaldos.orderBy('fecha').reverse().toArray()), [] as Respaldo[]);

async function guardarRespaldo(r: Respaldo) {
  await compartirArchivo(`respaldo-${perfil.value?.codigoDispositivo ?? ''}-${r.fecha.slice(0, 10)}.txt`, r.contenido, 'text/plain');
}

async function respaldoCompletoAArchivo() {
  trabajando.value = true;
  try {
    const paquete = await armarPaqueteDe(await db.nidos.toArray(), 'respaldo');
    const nombre = `respaldo-${paquete.deviceId}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.txt`;
    await compartirArchivo(nombre, JSON.stringify(paquete), 'text/plain', 'Respaldo de nidos');
  } finally {
    trabajando.value = false;
  }
}

async function restaurar(contenido: string, origen: string) {
  const ok = await confirmar({
    titulo: 'Restaurar respaldo',
    mensaje: `Se agregarán los nidos del ${origen} que falten en este teléfono. No se borra nada.`,
    accion: 'Restaurar',
  });
  if (!ok) return;
  try {
    const r = await importarPaquete(await leerPaquete(contenido), origen);
    await avisar(`${r.nuevos} recuperados, ${r.actualizados} actualizados${r.conflictos ? `, ${r.conflictos} por revisar` : ''}`);
  } catch (e) {
    await avisar(e instanceof Error ? e.message : String(e), 'danger');
  }
}

async function restaurarDeArchivo(e: Event) {
  const input = e.target as HTMLInputElement;
  const [archivo] = input.files ? await leerArchivos(input.files) : [];
  input.value = '';
  if (archivo) await restaurar(archivo.texto, `archivo ${archivo.nombre}`);
}

// ---------- Compartir la app ----------
const qr = ref('');
onMounted(async () => {
  qr.value = await QRCode.toDataURL(URL_APP, { margin: 1, width: 480, color: { dark: '#0b3f3a', light: '#ffffff' } });
});

async function copiarEnlace() {
  try {
    await navigator.clipboard.writeText(URL_APP);
    await avisar('Enlace copiado');
  } catch {
    await avisar(URL_APP, 'medium');
  }
}

// ---------- Servidor ----------
const servidor = reactive({ ...CONFIG_VACIA });
const estadoSync = useLiveQuery(() => leerEstadoSincronizacion(), null);
onMounted(async () => Object.assign(servidor, await leerConfigServidor()));

async function guardarServidor() {
  if (servidor.activo && !/^https?:\/\/.+/.test(servidor.url.trim())) {
    await avisar('Escribe la dirección completa, empezando con https://', 'warning');
    return;
  }
  await guardarConfigServidor({ ...servidor });
  if (servidor.activo) void sincronizar();
  await avisar(servidor.activo ? 'Servidor guardado' : 'Envío al servidor desactivado');
}

async function probarServidor() {
  trabajando.value = true;
  try {
    const ok = await new ApiAdapter({ url: servidor.url.trim().replace(/\/+$/, ''), token: servidor.token }).salud();
    await avisar(ok ? 'Conexión correcta' : 'El servidor respondió, pero no es el de Nidos de Tortuga', ok ? 'success' : 'warning');
  } catch (e) {
    await avisar(`Sin conexión con el servidor: ${e instanceof Error ? e.message : e}`, 'danger');
  } finally {
    trabajando.value = false;
  }
}

// ---------- Este teléfono ----------
const almacenamiento = ref<EstadoAlmacenamiento | null>(null);
onIonViewWillEnter(async () => {
  almacenamiento.value = await estadoAlmacenamiento();
});

const espacio = computed(() => {
  const a = almacenamiento.value;
  if (!a || a.usadoMB == null) return '…';
  return `${a.usadoMB} MB`;
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

<style scoped>
.datos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 12px;
  margin: 0 0 16px;
}
.datos dt {
  font-size: 0.8rem;
  color: var(--app-texto-suave);
  font-weight: 600;
  margin-bottom: 2px;
}
.datos dd {
  margin: 0;
  font-weight: 650;
  overflow-wrap: anywhere;
}
ion-button {
  margin: 0;
  min-height: 48px;
}
.botones {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}
.nota {
  margin: 10px 2px 0;
  font-size: 0.85rem;
  color: var(--app-texto-suave);
}
.respaldos {
  list-style: none;
  margin: 0;
  padding: 0;
}
.respaldos li {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
  border-bottom: 1px solid var(--app-borde-suave);
}
.respaldos li span {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.respaldos small {
  color: var(--app-texto-suave);
}
.respaldos ion-button {
  min-height: 44px;
}
.qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.qr img {
  width: 200px;
  height: 200px;
  border-radius: 12px;
  border: 1px solid var(--app-borde-suave);
}
.qr p {
  margin: 0;
  font-weight: 650;
  overflow-wrap: anywhere;
  text-align: center;
}
.interruptor {
  width: 100%;
  font-weight: 650;
  margin-bottom: 16px;
  min-height: 44px;
}
.ok {
  color: var(--ion-color-success);
  font-weight: 700;
}
.mal {
  color: var(--ion-color-warning-shade);
  font-weight: 700;
}
</style>
