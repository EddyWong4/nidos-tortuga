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
      <ion-toolbar class="barra-pasos">
        <PasosIndicador :pasos="PASOS.map((p) => p.titulo)" :actual="paso" @ir="irAPaso" />
      </ion-toolbar>
    </ion-header>

    <ion-content ref="contenido" class="ion-padding">
      <div v-if="mostrarErrores && hayErroresEnPaso" class="resumen-errores" role="alert">
        <ion-icon :icon="alertCircle" aria-hidden="true" />
        Revisa los campos marcados en rojo.
      </div>

      <!-- Paso 1: datos generales -->
      <template v-if="paso === 0">
        <TarjetaSeccion titulo="¿Cuándo y qué especie?" :icono="calendarOutline">
          <CampoForm etiqueta="Fecha de muestreo" :error="errores.fechaMuestreo">
            <EntradaTexto
              v-model="form.fechaMuestreo"
              etiqueta="Fecha de muestreo"
              tipo="date"
              :maximo-fecha="hoy"
              :invalido="!!errores.fechaMuestreo"
            />
          </CampoForm>
          <CampoForm v-slot="{ idEtiqueta }" etiqueta="Especie" :error="errores.especie">
            <SelectorOpciones
              v-model="form.especie"
              :opciones="catalogos.especie"
              :colores="COLOR_ESPECIE"
              :etiquetado-por="idEtiqueta"
              :invalido="!!errores.especie"
            />
          </CampoForm>
        </TarjetaSeccion>

        <TarjetaSeccion titulo="¿Dónde está el nido?" :icono="locationOutline">
          <CampoForm v-slot="{ idEtiqueta }" etiqueta="Municipio" :error="errores.municipio">
            <SelectorOpciones
              v-model="form.municipio"
              :opciones="catalogos.municipio"
              :etiquetado-por="idEtiqueta"
              :invalido="!!errores.municipio"
            />
          </CampoForm>
          <CampoForm etiqueta="Baliza" ayuda="Número de la baliza más cercana, del 1 al 31." :error="errores.baliza">
            <EntradaNumero
              v-model="form.baliza"
              etiqueta="Baliza"
              :minimo="1"
              :maximo="31"
              :invalido="!!errores.baliza"
            />
          </CampoForm>

          <div class="gps" :class="claseGps">
            <div class="gps-estado">
              <ion-spinner v-if="estadoGps === 'buscando'" name="crescent" />
              <ion-icon v-else :icon="iconoGps" aria-hidden="true" />
              <div>
                <strong>{{ tituloGps }}</strong>
                <p>{{ detalleGps }}</p>
              </div>
            </div>
            <ion-button
              expand="block"
              :fill="form.lat ? 'outline' : 'solid'"
              :disabled="estadoGps === 'buscando'"
              @click="buscarGps"
            >
              <ion-icon slot="start" :icon="locateOutline" />
              {{ estadoGps === 'buscando' ? 'Buscando señal…' : form.lat ? 'Volver a medir' : 'Obtener ubicación con GPS' }}
            </ion-button>
          </div>

          <div class="fila">
            <CampoForm etiqueta="Latitud" :error="errores.lat">
              <EntradaTexto
                v-model="form.lat"
                etiqueta="Latitud"
                teclado="decimal"
                ejemplo="Ej. 20.216751"
                :invalido="!!errores.lat"
                @update:model-value="marcarManual"
              />
            </CampoForm>
            <CampoForm etiqueta="Longitud" :error="errores.lng">
              <EntradaTexto
                v-model="form.lng"
                etiqueta="Longitud"
                teclado="decimal"
                ejemplo="Ej. -96.7765"
                :invalido="!!errores.lng"
                @update:model-value="marcarManual"
              />
            </CampoForm>
          </div>
        </TarjetaSeccion>
      </template>

      <!-- Paso 2: nido -->
      <template v-else-if="paso === 1">
        <TarjetaSeccion titulo="La puesta" :icono="timeOutline">
          <CampoForm v-slot="{ idEtiqueta }" etiqueta="Zona de anidación" :error="errores.zonaAnidacion">
            <SelectorOpciones
              v-model="form.zonaAnidacion"
              :opciones="catalogos.zonaAnidacion"
              :etiquetado-por="idEtiqueta"
              :invalido="!!errores.zonaAnidacion"
            />
          </CampoForm>
          <CampoForm etiqueta="Hora de puesta" :error="errores.horaPuesta">
            <EntradaTexto
              v-model="form.horaPuesta"
              etiqueta="Hora de puesta"
              tipo="time"
              :invalido="!!errores.horaPuesta"
            />
          </CampoForm>
        </TarjetaSeccion>

        <TarjetaSeccion titulo="Huevos" :icono="eggOutline">
          <CampoForm etiqueta="Tamaño de la nidada" ayuda="Total de huevos puestos." :error="errores.tamanioNidada">
            <EntradaNumero
              v-model="form.tamanioNidada"
              etiqueta="Tamaño de la nidada"
              :minimo="1"
              :maximo="250"
              :invalido="!!errores.tamanioNidada"
            />
          </CampoForm>
          <CampoForm
            etiqueta="Huevos sembrados"
            ayuda="No puede ser mayor que la nidada."
            :error="errores.huevosSembrados"
          >
            <EntradaNumero
              v-model="form.huevosSembrados"
              etiqueta="Huevos sembrados"
              :minimo="0"
              :maximo="250"
              :invalido="!!errores.huevosSembrados"
            />
          </CampoForm>
        </TarjetaSeccion>

        <TarjetaSeccion titulo="Incubación" :icono="leafOutline">
          <CampoForm v-slot="{ idEtiqueta }" etiqueta="Tipo de incubación" :error="errores.tipoIncubacion">
            <SelectorOpciones
              v-model="form.tipoIncubacion"
              :opciones="catalogos.tipoIncubacion"
              :etiquetado-por="idEtiqueta"
              :columnas="2"
              :invalido="!!errores.tipoIncubacion"
            />
          </CampoForm>
          <div v-if="emergenciaProbable" class="dato-calculado">
            <ion-icon :icon="sparklesOutline" aria-hidden="true" />
            <div>
              <span>Emergencia probable</span>
              <strong>{{ emergenciaProbable }}</strong>
              <small>Fecha de muestreo + 45 días</small>
            </div>
          </div>
        </TarjetaSeccion>
      </template>

      <!-- Paso 3: hembra (opcional) -->
      <template v-else>
        <TarjetaSeccion
          titulo="La hembra"
          subtitulo="Todo es opcional. Si no la viste, puedes guardar directamente."
          :icono="bodyOutline"
        >
          <div class="fila">
            <CampoForm etiqueta="Largo curvo" opcional :error="errores.largoCurvoCm">
              <EntradaTexto
                v-model="form.largoCurvoCm"
                etiqueta="Largo curvo del caparazón"
                teclado="decimal"
                ejemplo="Ej. 98.5"
                unidad="cm"
                :invalido="!!errores.largoCurvoCm"
              />
            </CampoForm>
            <CampoForm etiqueta="Ancho curvo" opcional :error="errores.anchoCurvoCm">
              <EntradaTexto
                v-model="form.anchoCurvoCm"
                etiqueta="Ancho curvo del caparazón"
                teclado="decimal"
                ejemplo="Ej. 90"
                unidad="cm"
                :invalido="!!errores.anchoCurvoCm"
              />
            </CampoForm>
          </div>
          <CampoForm etiqueta="Placa" opcional ayuda="Hasta 12 letras o números." :error="errores.placa">
            <EntradaTexto
              v-model="form.placa"
              etiqueta="Placa"
              ejemplo="Ej. MX1234"
              mayusculas="characters"
              :maximo="12"
              :invalido="!!errores.placa"
            />
          </CampoForm>
          <CampoForm etiqueta="Observaciones de la hembra" opcional>
            <EntradaNotas
              v-model="form.observacionesHembra"
              etiqueta="Observaciones de la hembra"
              ejemplo="Heridas, epibiontes, comportamiento…"
            />
          </CampoForm>
        </TarjetaSeccion>
      </template>
    </ion-content>

    <ion-footer class="pie">
      <div class="acciones">
        <ion-button v-if="paso > 0" fill="outline" class="atras" @click="irAPaso(paso - 1)">
          <ion-icon slot="start" :icon="chevronBack" />
          Atrás
        </ion-button>
        <ion-button v-if="paso < PASOS.length - 1" class="principal" @click="siguiente">
          Siguiente
          <ion-icon slot="end" :icon="chevronForward" />
        </ion-button>
        <ion-button v-else color="success" class="principal" :disabled="guardando" @click="guardar">
          <ion-icon slot="start" :icon="checkmarkCircle" />
          {{ id ? 'Guardar cambios' : 'Guardar nido' }}
        </ion-button>
      </div>
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
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/vue';
import {
  alertCircle,
  bodyOutline,
  calendarOutline,
  checkmarkCircle,
  chevronBack,
  chevronForward,
  eggOutline,
  leafOutline,
  locateOutline,
  locationOutline,
  navigateCircleOutline,
  pencilOutline,
  sparklesOutline,
  timeOutline,
  warningOutline,
} from 'ionicons/icons';
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import PasosIndicador from '@/components/PasosIndicador.vue';
import TarjetaSeccion from '@/components/TarjetaSeccion.vue';
import CampoForm from '@/components/form/CampoForm.vue';
import EntradaNotas from '@/components/form/EntradaNotas.vue';
import EntradaNumero from '@/components/form/EntradaNumero.vue';
import EntradaTexto from '@/components/form/EntradaTexto.vue';
import SelectorOpciones from '@/components/form/SelectorOpciones.vue';
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
import { COLOR_ESPECIE } from '@/ui/colores';

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
const hayErroresEnPaso = computed(() => PASOS[paso.value].campos.some((c) => errores.value[c]));

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

const tituloGps = computed(() => {
  if (estadoGps.value === 'buscando') return lectura.value ? 'Afinando la ubicación…' : 'Buscando señal de GPS…';
  if (estadoGps.value === 'error' && !form.lat) return 'No se obtuvo la ubicación';
  if (form.ubicacionManual && form.lat) return 'Coordenadas escritas a mano';
  if (form.precisionGps != null) return `Ubicación obtenida · ±${form.precisionGps} m`;
  return 'Sin ubicación todavía';
});

const detalleGps = computed(() => {
  if (estadoGps.value === 'buscando') {
    return lectura.value
      ? `Precisión actual ±${lectura.value.precision} m. Mantén el teléfono quieto.`
      : 'Funciona sin internet. Puede tardar hasta 30 segundos.';
  }
  if (estadoGps.value === 'error' && !form.lat) return errorGps.value;
  if (form.ubicacionManual && form.lat) return 'Revisa que estén bien escritas.';
  if (form.precisionGps != null) {
    return form.precisionGps <= 10 ? 'Buena precisión.' : 'Precisión baja: si puedes, vuelve a medir en un lugar abierto.';
  }
  return 'Toca el botón o escribe las coordenadas abajo.';
});

const claseGps = computed(() => {
  if (estadoGps.value === 'buscando') return 'gps--buscando';
  if (estadoGps.value === 'error' && !form.lat) return 'gps--mal';
  if (form.ubicacionManual && form.lat) return 'gps--manual';
  if (form.precisionGps == null) return '';
  return form.precisionGps <= 10 ? 'gps--bien' : form.precisionGps <= 30 ? 'gps--regular' : 'gps--mal';
});

const iconoGps = computed(() => {
  if (estadoGps.value === 'error' && !form.lat) return warningOutline;
  if (form.ubicacionManual && form.lat) return pencilOutline;
  return navigateCircleOutline;
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

/** Lleva la vista al primer campo marcado en rojo, para que se vea qué falta sin buscarlo. */
async function irAlPrimerError() {
  await nextTick();
  const pagina = contenido.value?.$el as HTMLElement | undefined;
  pagina?.querySelector('.campo--error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function siguiente() {
  const e = validarPuesta(form).errores;
  if (PASOS[paso.value].campos.some((c) => e[c])) {
    mostrarErrores.value = true;
    void irAlPrimerError();
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
    paso.value = conError >= 0 ? conError : paso.value;
    void irAlPrimerError();
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
.barra-pasos {
  --min-height: 0;
  --padding-start: 0;
  --padding-end: 0;
}
.resumen-errores {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  margin-bottom: 14px;
  border-radius: 12px;
  background: var(--app-error-suave);
  color: var(--ion-color-danger);
  font-weight: 650;
}
.resumen-errores ion-icon {
  font-size: 1.3rem;
  flex: none;
}
.fila {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* GPS */
.gps {
  padding: 14px;
  margin-bottom: 20px;
  border-radius: 12px;
  background: var(--ion-background-color);
  border: 1.5px solid var(--app-borde-suave);
  border-left: 5px solid var(--app-borde);
}
.gps-estado {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
.gps-estado > ion-icon,
.gps-estado > ion-spinner {
  flex: none;
  font-size: 1.8rem;
  width: 28px;
  height: 28px;
  color: var(--app-texto-suave);
}
.gps-estado strong {
  display: block;
  font-size: 1rem;
}
.gps-estado p {
  margin: 2px 0 0;
  font-size: 0.875rem;
  color: var(--app-texto-suave);
}
.gps--buscando {
  border-left-color: var(--ion-color-primary);
}
.gps--bien {
  border-left-color: var(--ion-color-success);
  background: var(--app-exito-suave);
}
.gps--bien .gps-estado > ion-icon {
  color: var(--ion-color-success);
}
.gps--regular,
.gps--manual {
  border-left-color: var(--ion-color-warning);
  background: var(--app-aviso-suave);
}
.gps--regular .gps-estado > ion-icon,
.gps--manual .gps-estado > ion-icon {
  color: var(--ion-color-warning);
}
.gps--mal {
  border-left-color: var(--ion-color-danger);
  background: var(--app-error-suave);
}
.gps--mal .gps-estado > ion-icon {
  color: var(--ion-color-danger);
}

/* Emergencia probable */
.dato-calculado {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 14px;
  border-radius: 12px;
  background: var(--app-primario-suave);
}
.dato-calculado ion-icon {
  font-size: 1.6rem;
  color: var(--ion-color-primary);
  flex: none;
}
.dato-calculado span,
.dato-calculado small {
  display: block;
  color: var(--app-texto-suave);
  font-size: 0.85rem;
}
.dato-calculado strong {
  display: block;
  font-size: 1.15rem;
  color: var(--ion-color-primary-shade);
}

/* Barra inferior */
.pie {
  background: #ffffff;
  box-shadow: 0 -1px 0 var(--app-borde-suave);
}
.acciones {
  display: flex;
  gap: 10px;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
}
.acciones ion-button {
  margin: 0;
  min-height: 52px;
  font-size: 1.05rem;
}
.atras {
  flex: 0 0 auto;
}
.principal {
  flex: 1;
}
</style>
