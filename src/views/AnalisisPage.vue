<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/nidos/${id}`" text="" />
        </ion-buttons>
        <ion-title>Análisis {{ folio }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content ref="contenido" class="ion-padding">
      <p class="intro">Llénalo después de la emergencia. Puedes guardar aunque falten datos y completarlo luego.</p>

      <TarjetaSeccion titulo="Emergencia" :icono="calendarOutline">
        <CampoForm
          etiqueta="Fecha de emergencia"
          :ayuda="fechaMuestreo ? `Muestreo: ${fechaCorta(fechaMuestreo)}` : undefined"
          :error="errores.fechaEmergencia"
        >
          <EntradaTexto
            v-model="form.fechaEmergencia"
            etiqueta="Fecha de emergencia"
            tipo="date"
            :minimo="fechaMuestreo"
            :maximo-fecha="hoy"
            :invalido="!!errores.fechaEmergencia"
          />
        </CampoForm>
      </TarjetaSeccion>

      <TarjetaSeccion titulo="Huevos" :icono="eggOutline">
        <CampoForm etiqueta="Eclosionados" :error="errores.huevosEclosionados">
          <EntradaNumero
            v-model="form.huevosEclosionados"
            etiqueta="Huevos eclosionados"
            :minimo="0"
            :maximo="250"
            :invalido="!!errores.huevosEclosionados"
          />
        </CampoForm>
        <CampoForm etiqueta="Sin desarrollo" :error="errores.huevosSinDesarrollo">
          <EntradaNumero
            v-model="form.huevosSinDesarrollo"
            etiqueta="Huevos sin desarrollo"
            :minimo="0"
            :maximo="250"
            :invalido="!!errores.huevosSinDesarrollo"
          />
        </CampoForm>
        <CampoForm etiqueta="Con desarrollo aparente" :error="errores.huevosConDesarrolloAparente">
          <EntradaNumero
            v-model="form.huevosConDesarrolloAparente"
            etiqueta="Huevos con desarrollo aparente"
            :minimo="0"
            :maximo="250"
            :invalido="!!errores.huevosConDesarrolloAparente"
          />
        </CampoForm>
      </TarjetaSeccion>

      <TarjetaSeccion titulo="Resultados" subtitulo="Se calculan solos mientras escribes." :icono="calculatorOutline">
        <div class="resultados">
          <div class="resultado resultado--destacado">
            <span class="resultado-valor">{{ valor(derivados.exitoEclosion, ' %') }}</span>
            <span class="resultado-etiqueta">Éxito de eclosión</span>
          </div>
          <div class="resultado">
            <span class="resultado-valor">{{ valor(derivados.totalHuevos) }}</span>
            <span class="resultado-etiqueta">Total de huevos</span>
          </div>
          <div class="resultado">
            <span class="resultado-valor">{{ valor(derivados.huevosNoEclosionados) }}</span>
            <span class="resultado-etiqueta">No eclosionados</span>
          </div>
          <div class="resultado">
            <span class="resultado-valor">{{ valor(derivados.periodoIncubacion) }}</span>
            <span class="resultado-etiqueta">Días de incubación</span>
          </div>
        </div>
      </TarjetaSeccion>

      <TarjetaSeccion titulo="Crías" :icono="heartOutline">
        <div class="fila">
          <CampoForm etiqueta="Vivas" :error="errores.criasVivas">
            <EntradaTexto
              v-model="form.criasVivas"
              etiqueta="Crías vivas"
              teclado="numeric"
              ejemplo="0"
              :invalido="!!errores.criasVivas"
            />
          </CampoForm>
          <CampoForm etiqueta="Muertas" :error="errores.criasMuertas">
            <EntradaTexto
              v-model="form.criasMuertas"
              etiqueta="Crías muertas"
              teclado="numeric"
              ejemplo="0"
              :invalido="!!errores.criasMuertas"
            />
          </CampoForm>
        </div>
      </TarjetaSeccion>

      <TarjetaSeccion titulo="Estado del nido" :icono="clipboardOutline">
        <CampoForm v-slot="{ idEtiqueta }" etiqueta="Estatus del análisis">
          <SelectorOpciones
            v-model="form.estatusAnalisis"
            :opciones="catalogos.estatusAnalisis"
            :etiquetado-por="idEtiqueta"
            :columnas="2"
          />
        </CampoForm>
        <CampoForm v-slot="{ idEtiqueta }" etiqueta="Pérdida de nidada">
          <SelectorOpciones
            v-model="form.perdidaNidada"
            :opciones="catalogos.perdidaNidada"
            opcion-vacia="Ninguna"
            :etiquetado-por="idEtiqueta"
            :columnas="2"
          />
        </CampoForm>
        <CampoForm etiqueta="Observaciones del nido" opcional>
          <EntradaNotas
            v-model="form.observacionesNido"
            etiqueta="Observaciones del nido"
            ejemplo="Depredadores, raíces, humedad…"
          />
        </CampoForm>
      </TarjetaSeccion>
    </ion-content>

    <ion-footer class="pie">
      <div class="acciones">
        <ion-button expand="block" color="success" :disabled="guardando" @click="guardar">
          <ion-icon slot="start" :icon="checkmarkCircle" />
          Guardar análisis
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
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/vue';
import {
  calculatorOutline,
  calendarOutline,
  checkmarkCircle,
  clipboardOutline,
  eggOutline,
  heartOutline,
} from 'ionicons/icons';
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import TarjetaSeccion from '@/components/TarjetaSeccion.vue';
import CampoForm from '@/components/form/CampoForm.vue';
import EntradaNotas from '@/components/form/EntradaNotas.vue';
import EntradaNumero from '@/components/form/EntradaNumero.vue';
import EntradaTexto from '@/components/form/EntradaTexto.vue';
import SelectorOpciones from '@/components/form/SelectorOpciones.vue';
import { avisar } from '@/composables/useAviso';
import { useBorrador } from '@/composables/useBorrador';
import { useCatalogos } from '@/composables/useCatalogos';
import { db } from '@/db/database';
import { actualizarNido } from '@/db/repositorio';
import { fechaCorta, hoyISO, valor } from '@/domain/formato';
import { analisisAFormulario, numerosAnalisis, validarAnalisis, type FormAnalisis } from '@/domain/formulario';
import { calcularDerivados } from '@/domain/formulas';
import { analisisVacio } from '@/domain/schemas';

const route = useRoute();
const router = useIonRouter();
const catalogos = useCatalogos();
const id = String(route.params.id);
const hoy = hoyISO();

const folio = ref('');
const fechaMuestreo = ref('');
const form = reactive<FormAnalisis>(analisisAFormulario(analisisVacio()));
const intentado = ref(false);
const guardando = ref(false);
const contenido = ref<InstanceType<typeof IonContent> | null>(null);

const errores = computed(() => (intentado.value ? validarAnalisis(form, fechaMuestreo.value).errores : {}));

// Los campos calculados se ven mientras se escribe.
const derivados = computed(() => {
  if (!fechaMuestreo.value) {
    return { huevosNoEclosionados: null, totalHuevos: null, exitoEclosion: null, periodoIncubacion: null };
  }
  const d = calcularDerivados(fechaMuestreo.value, numerosAnalisis(form));
  // Una fecha de emergencia anterior al muestreo ya se marca como error; no mostramos días negativos.
  return { ...d, periodoIncubacion: d.periodoIncubacion != null && d.periodoIncubacion < 0 ? null : d.periodoIncubacion };
});

const borrador = useBorrador(`analisis:${id}`, id, form);

onMounted(async () => {
  const nido = await db.nidos.get(id);
  if (!nido) return;
  folio.value = nido.folio;
  fechaMuestreo.value = nido.fechaMuestreo;
  Object.assign(form, analisisAFormulario(nido.analisis));
  const guardado = await borrador.recuperar();
  if (guardado) {
    Object.assign(form, guardado);
    void avisar('Se recuperó lo que llevabas capturado', 'medium');
  }
  borrador.activar();
});

async function guardar() {
  intentado.value = true;
  const { datos } = validarAnalisis(form, fechaMuestreo.value);
  if (!datos) {
    await nextTick();
    (contenido.value?.$el as HTMLElement | undefined)
      ?.querySelector('.campo--error')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  guardando.value = true;
  try {
    await actualizarNido(id, { analisis: datos });
    await borrador.descartar();
    await avisar(`Análisis de ${folio.value} guardado`);
    if (router.canGoBack()) router.back();
    else router.replace(`/nidos/${id}`);
  } catch (err) {
    console.error(err);
    await avisar(`No se pudo guardar: ${err instanceof Error ? err.message : err}`, 'danger');
  } finally {
    guardando.value = false;
  }
}
</script>

<style scoped>
.intro {
  margin: 0 2px 14px;
  color: var(--app-texto-suave);
  font-size: 0.95rem;
}
.fila {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.resultados {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.resultado {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  border-radius: 12px;
  background: var(--ion-background-color);
}
.resultado--destacado {
  grid-column: 1 / -1;
  background: var(--app-primario-suave);
}
.resultado-valor {
  font-size: 1.5rem;
  font-weight: 750;
  color: var(--app-texto);
}
.resultado--destacado .resultado-valor {
  font-size: 2rem;
  color: var(--ion-color-primary-shade);
}
.resultado-etiqueta {
  font-size: 0.85rem;
  color: var(--app-texto-suave);
}
.pie {
  background: #ffffff;
  box-shadow: 0 -1px 0 var(--app-borde-suave);
}
.acciones {
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
}
.acciones ion-button {
  margin: 0;
  min-height: 52px;
  font-size: 1.05rem;
}
</style>
