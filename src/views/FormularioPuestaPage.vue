<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button :default-href="id ? `/nidos/${id}` : '/tabs/nidos'" text="" />
        </ion-buttons>
        <ion-title>{{ titulo }}</ion-title>
        <ion-buttons v-if="hayBorrador && !id" slot="end">
          <ion-button @click="empezarDeNuevo">Limpiar</ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar class="barra-paso">
        <div class="paso">
          <strong>Paso {{ paso + 1 }} de {{ PASOS.length }}</strong> · {{ PASOS[paso].titulo }}
        </div>
        <ion-progress-bar :value="(paso + 1) / PASOS.length" />
      </ion-toolbar>
    </ion-header>

    <ion-content ref="contenido" class="ion-padding">
      <!-- Paso 1: datos generales -->
      <template v-if="paso === 0">
        <div class="campo">
          <ion-input
            v-model="form.fechaMuestreo"
            type="date"
            label="Fecha de muestreo"
            label-placement="stacked"
            fill="outline"
            :max="hoy"
            :class="{ 'ion-invalid ion-touched': errores.fechaMuestreo }"
          />
          <CampoError :mensaje="errores.fechaMuestreo" />
        </div>

        <div class="campo">
          <ion-select
            v-model="form.especie"
            label="Especie"
            label-placement="stacked"
            fill="outline"
            placeholder="Selecciona"
            interface="action-sheet"
            cancel-text="Cancelar"
            :interface-options="{ header: 'Especie' }"
            :class="{ 'ion-invalid ion-touched': errores.especie }"
          >
            <ion-select-option v-for="v in catalogos.especie" :key="v" :value="v">{{ v }}</ion-select-option>
          </ion-select>
          <CampoError :mensaje="errores.especie" />
        </div>

        <div class="fila">
          <div class="campo">
            <ion-select
              v-model="form.municipio"
              label="Municipio"
              label-placement="stacked"
              fill="outline"
              placeholder="Selecciona"
              interface="action-sheet"
              cancel-text="Cancelar"
              :interface-options="{ header: 'Municipio' }"
              :class="{ 'ion-invalid ion-touched': errores.municipio }"
            >
              <ion-select-option v-for="v in catalogos.municipio" :key="v" :value="v">{{ v }}</ion-select-option>
            </ion-select>
            <CampoError :mensaje="errores.municipio" />
          </div>
          <div class="campo angosto">
            <ion-input
              v-model="form.baliza"
              label="Baliza"
              label-placement="stacked"
              fill="outline"
              inputmode="numeric"
              placeholder="1 a 31"
              :class="{ 'ion-invalid ion-touched': errores.baliza }"
            />
            <CampoError :mensaje="errores.baliza" />
          </div>
        </div>

        <div class="gps" :class="claseGps">
          <div class="gps-texto">
            <ion-spinner v-if="estadoGps === 'buscando'" name="crescent" />
            <ion-icon v-else :icon="locateOutline" />
            <span>{{ textoGps }}</span>
          </div>
          <ion-button fill="outline" size="default" :disabled="estadoGps === 'buscando'" @click="buscarGps">
            {{ estadoGps === 'buscando' ? 'Buscando…' : form.lat ? 'Volver a medir' : 'Obtener ubicación' }}
          </ion-button>
        </div>

        <div class="fila">
          <div class="campo">
            <ion-input
              v-model="form.lat"
              label="Latitud"
              label-placement="stacked"
              fill="outline"
              inputmode="decimal"
              placeholder="Ej. 20.216751"
              :class="{ 'ion-invalid ion-touched': errores.lat }"
              @ion-input="marcarManual"
            />
            <CampoError :mensaje="errores.lat" />
          </div>
          <div class="campo">
            <ion-input
              v-model="form.lng"
              label="Longitud"
              label-placement="stacked"
              fill="outline"
              inputmode="decimal"
              placeholder="Ej. -96.776543"
              :class="{ 'ion-invalid ion-touched': errores.lng }"
              @ion-input="marcarManual"
            />
            <CampoError :mensaje="errores.lng" />
          </div>
        </div>
      </template>

      <!-- Paso 2: nido -->
      <template v-else-if="paso === 1">
        <div class="fila">
          <div class="campo">
            <ion-select
              v-model="form.zonaAnidacion"
              label="Zona de anidación"
              label-placement="stacked"
              fill="outline"
              placeholder="Selecciona"
              interface="action-sheet"
              cancel-text="Cancelar"
              :interface-options="{ header: 'Zona de anidación' }"
              :class="{ 'ion-invalid ion-touched': errores.zonaAnidacion }"
            >
              <ion-select-option v-for="v in catalogos.zonaAnidacion" :key="v" :value="v">{{ v }}</ion-select-option>
            </ion-select>
            <CampoError :mensaje="errores.zonaAnidacion" />
          </div>
          <div class="campo">
            <ion-input
              v-model="form.horaPuesta"
              type="time"
              label="Hora de puesta"
              label-placement="stacked"
              fill="outline"
              :class="{ 'ion-invalid ion-touched': errores.horaPuesta }"
            />
            <CampoError :mensaje="errores.horaPuesta" />
          </div>
        </div>

        <div class="fila">
          <div class="campo">
            <ion-input
              v-model="form.tamanioNidada"
              label="Tamaño de la nidada"
              label-placement="stacked"
              fill="outline"
              inputmode="numeric"
              placeholder="1 a 250"
              :class="{ 'ion-invalid ion-touched': errores.tamanioNidada }"
            />
            <CampoError :mensaje="errores.tamanioNidada" />
          </div>
          <div class="campo">
            <ion-input
              v-model="form.huevosSembrados"
              label="Huevos sembrados"
              label-placement="stacked"
              fill="outline"
              inputmode="numeric"
              placeholder="0 a 250"
              :class="{ 'ion-invalid ion-touched': errores.huevosSembrados }"
            />
            <CampoError :mensaje="errores.huevosSembrados" />
          </div>
        </div>

        <div class="campo">
          <ion-select
            v-model="form.tipoIncubacion"
            label="Tipo de incubación"
            label-placement="stacked"
            fill="outline"
            placeholder="Selecciona"
            interface="action-sheet"
            cancel-text="Cancelar"
            :interface-options="{ header: 'Tipo de incubación' }"
            :class="{ 'ion-invalid ion-touched': errores.tipoIncubacion }"
          >
            <ion-select-option v-for="v in catalogos.tipoIncubacion" :key="v" :value="v">{{ v }}</ion-select-option>
          </ion-select>
          <CampoError :mensaje="errores.tipoIncubacion" />
        </div>

        <p v-if="emergenciaProbable" class="calculado">
          Emergencia probable: <strong>{{ emergenciaProbable }}</strong> (muestreo + 45 días)
        </p>
      </template>

      <!-- Paso 3: hembra (opcional) -->
      <template v-else>
        <p class="nota">Todos los datos de la hembra son opcionales.</p>
        <div class="fila">
          <div class="campo">
            <ion-input
              v-model="form.largoCurvoCm"
              label="Largo curvo (cm)"
              label-placement="stacked"
              fill="outline"
              inputmode="decimal"
              placeholder="0 a 250"
              :class="{ 'ion-invalid ion-touched': errores.largoCurvoCm }"
            />
            <CampoError :mensaje="errores.largoCurvoCm" />
          </div>
          <div class="campo">
            <ion-input
              v-model="form.anchoCurvoCm"
              label="Ancho curvo (cm)"
              label-placement="stacked"
              fill="outline"
              inputmode="decimal"
              placeholder="0 a 250"
              :class="{ 'ion-invalid ion-touched': errores.anchoCurvoCm }"
            />
            <CampoError :mensaje="errores.anchoCurvoCm" />
          </div>
        </div>

        <div class="campo">
          <ion-input
            v-model="form.placa"
            label="Placa"
            label-placement="stacked"
            fill="outline"
            placeholder="Hasta 12 letras o números"
            autocapitalize="characters"
            :maxlength="12"
            :class="{ 'ion-invalid ion-touched': errores.placa }"
          />
          <CampoError :mensaje="errores.placa" />
        </div>

        <div class="campo">
          <ion-textarea
            v-model="form.observacionesHembra"
            label="Observaciones de la hembra"
            label-placement="stacked"
            fill="outline"
            :auto-grow="true"
            :counter="true"
            :maxlength="200"
          />
        </div>
      </template>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <div class="acciones">
          <ion-button fill="outline" :disabled="paso === 0" @click="irAPaso(paso - 1)">Atrás</ion-button>
          <ion-button v-if="paso < PASOS.length - 1" @click="siguiente">Siguiente</ion-button>
          <ion-button v-else color="success" :disabled="guardando" @click="guardar">
            {{ id ? 'Guardar cambios' : 'Guardar nido' }}
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonPage,
  IonProgressBar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/vue';
import { locateOutline } from 'ionicons/icons';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import CampoError from '@/components/CampoError.vue';
import { avisar } from '@/composables/useAviso';
import { useBorrador } from '@/composables/useBorrador';
import { useCatalogos } from '@/composables/useCatalogos';
import { useGps } from '@/composables/useGps';
import { db } from '@/db/database';
import { actualizarNido, crearNido } from '@/db/repositorio';
import { fechaCorta, horaActual, hoyISO } from '@/domain/formato';
import { formularioPuestaVacio, puestaAFormulario, validarPuesta, type FormPuesta } from '@/domain/formulario';
import { fechaProbableEmergencia } from '@/domain/formulas';
import { usePerfilStore } from '@/stores/perfil';

const PASOS: { titulo: string; campos: (keyof FormPuesta)[] }[] = [
  { titulo: 'Datos generales', campos: ['fechaMuestreo', 'especie', 'municipio', 'baliza', 'lat', 'lng'] },
  { titulo: 'Nido', campos: ['zonaAnidacion', 'horaPuesta', 'tamanioNidada', 'huevosSembrados', 'tipoIncubacion'] },
  { titulo: 'Hembra', campos: ['largoCurvoCm', 'anchoCurvoCm', 'placa', 'observacionesHembra'] },
];

const route = useRoute();
const router = useIonRouter();
const perfil = usePerfilStore();
const catalogos = useCatalogos();

/** Con id = edición de un nido existente; sin id = nido nuevo. */
const id = typeof route.params.id === 'string' ? route.params.id : null;
const folio = ref('');
const titulo = computed(() => (id ? `Editar ${folio.value}` : 'Nuevo nido'));
const hoy = hoyISO();

const form = reactive<FormPuesta>(formularioPuestaVacio());
const paso = ref(0);
const mostrarErrores = ref(false);
const guardando = ref(false);
const hayBorrador = ref(false);
const contenido = ref<InstanceType<typeof IonContent> | null>(null);

// Los errores se recalculan en vivo una vez que el usuario intentó avanzar.
const errores = computed(() => (mostrarErrores.value ? validarPuesta(form).errores : {}));

const emergenciaProbable = computed(() =>
  /^\d{4}-\d{2}-\d{2}$/.test(form.fechaMuestreo) ? fechaCorta(fechaProbableEmergencia(form.fechaMuestreo)) : '',
);

// ---------- GPS ----------
const { estado: estadoGps, error: errorGps, lectura, buscar: buscarGps } = useGps();

watch(lectura, (l) => {
  if (!l) return;
  form.lat = String(l.lat);
  form.lng = String(l.lng);
  form.precisionGps = l.precision;
  form.ubicacionManual = false;
});

function marcarManual() {
  form.ubicacionManual = true;
  form.precisionGps = null;
}

const textoGps = computed(() => {
  if (estadoGps.value === 'buscando') {
    return lectura.value ? `Afinando… precisión actual ±${lectura.value.precision} m` : 'Buscando señal de GPS…';
  }
  if (estadoGps.value === 'error' && !form.lat) return errorGps.value;
  if (form.ubicacionManual && form.lat) return 'Coordenadas escritas a mano';
  if (form.precisionGps != null) return `Ubicación con precisión de ±${form.precisionGps} m`;
  return 'Sin ubicación todavía';
});

const claseGps = computed(() => {
  if (estadoGps.value === 'error' && !form.lat) return 'gps-mal';
  if (form.precisionGps == null) return '';
  return form.precisionGps <= 10 ? 'gps-bien' : form.precisionGps <= 30 ? 'gps-regular' : 'gps-mal';
});

// ---------- Borrador ----------
const borrador = useBorrador(id ? `editar:${id}` : 'nuevo', id, form);

async function valoresIniciales(): Promise<FormPuesta> {
  if (id) {
    const nido = await db.nidos.get(id);
    if (!nido) throw new Error('No se encontró el nido');
    folio.value = nido.folio;
    return puestaAFormulario(nido);
  }
  // Lo más probable es que el siguiente nido sea en el mismo municipio y zona que el anterior.
  const ultimo = await db.nidos.orderBy('updatedAt').last();
  return formularioPuestaVacio({
    fechaMuestreo: hoy,
    horaPuesta: horaActual(),
    municipio: ultimo?.municipio ?? '',
    zonaAnidacion: ultimo?.zonaAnidacion ?? '',
  });
}

onMounted(async () => {
  Object.assign(form, await valoresIniciales());
  const guardado = await borrador.recuperar();
  if (guardado) {
    Object.assign(form, guardado);
    hayBorrador.value = true;
    void avisar('Se recuperó lo que llevabas capturado', 'medium');
  }
  borrador.activar();
  if (!id && !form.lat) buscarGps();
});

async function empezarDeNuevo() {
  await borrador.descartar();
  Object.assign(form, await valoresIniciales());
  hayBorrador.value = false;
  mostrarErrores.value = false;
  paso.value = 0;
  borrador.activar();
  if (!form.lat) buscarGps();
}

// ---------- Navegación entre pasos ----------
function irAPaso(n: number) {
  paso.value = n;
  void contenido.value?.$el.scrollToTop(200);
}

function siguiente() {
  const e = validarPuesta(form).errores;
  if (PASOS[paso.value].campos.some((c) => e[c])) {
    mostrarErrores.value = true;
    return;
  }
  mostrarErrores.value = false;
  irAPaso(paso.value + 1);
}

async function guardar() {
  const { datos, errores: e } = validarPuesta(form);
  if (!datos) {
    mostrarErrores.value = true;
    const conError = PASOS.findIndex((p) => p.campos.some((c) => e[c]));
    if (conError >= 0) irAPaso(conError);
    return;
  }
  guardando.value = true;
  try {
    const nido = id ? await actualizarNido(id, datos) : await crearNido(datos);
    await borrador.descartar();
    await perfil.refrescar();
    await avisar(id ? `Cambios guardados en ${nido.folio}` : `Nido ${nido.folio} guardado`);
    if (id) router.back();
    else router.replace(`/nidos/${nido.id}`);
  } catch (err) {
    console.error(err);
    await avisar(`No se pudo guardar: ${err instanceof Error ? err.message : err}`, 'danger');
  } finally {
    guardando.value = false;
  }
}
</script>

<style scoped>
.barra-paso {
  --min-height: 0;
}
.paso {
  padding: 8px 16px;
  font-size: 0.9rem;
}
.campo {
  margin-bottom: 16px;
  flex: 1;
  min-width: 0;
}
.fila {
  display: flex;
  gap: 12px;
}
.angosto {
  flex: 0 0 96px;
}
.gps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  margin-bottom: 16px;
  border-radius: 8px;
  background: var(--ion-color-light);
  border-left: 4px solid var(--ion-color-medium);
}
.gps-texto {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}
.gps-bien {
  border-left-color: var(--ion-color-success);
}
.gps-regular {
  border-left-color: var(--ion-color-warning);
}
.gps-mal {
  border-left-color: var(--ion-color-danger);
}
.calculado,
.nota {
  color: var(--ion-color-medium-shade);
  font-size: 0.9rem;
}
.acciones {
  display: flex;
  gap: 12px;
  padding: 8px 16px;
}
.acciones ion-button {
  flex: 1;
}
</style>
