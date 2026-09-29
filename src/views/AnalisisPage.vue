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

    <ion-content class="ion-padding">
      <div class="campo">
        <ion-input
          v-model="form.fechaEmergencia"
          type="date"
          label="Fecha de emergencia"
          label-placement="stacked"
          fill="outline"
          :min="fechaMuestreo"
          :max="hoy"
          :class="{ 'ion-invalid ion-touched': errores.fechaEmergencia }"
        />
        <CampoError :mensaje="errores.fechaEmergencia" />
      </div>

      <div class="fila">
        <div class="campo">
          <ion-input
            v-model="form.huevosEclosionados"
            label="Eclosionados"
            label-placement="stacked"
            fill="outline"
            inputmode="numeric"
            :class="{ 'ion-invalid ion-touched': errores.huevosEclosionados }"
          />
          <CampoError :mensaje="errores.huevosEclosionados" />
        </div>
        <div class="campo">
          <ion-input
            v-model="form.huevosSinDesarrollo"
            label="Sin desarrollo"
            label-placement="stacked"
            fill="outline"
            inputmode="numeric"
            :class="{ 'ion-invalid ion-touched': errores.huevosSinDesarrollo }"
          />
          <CampoError :mensaje="errores.huevosSinDesarrollo" />
        </div>
      </div>

      <div class="campo">
        <ion-input
          v-model="form.huevosConDesarrolloAparente"
          label="Con desarrollo aparente"
          label-placement="stacked"
          fill="outline"
          inputmode="numeric"
          :class="{ 'ion-invalid ion-touched': errores.huevosConDesarrolloAparente }"
        />
        <CampoError :mensaje="errores.huevosConDesarrolloAparente" />
      </div>

      <div class="fila">
        <div class="campo">
          <ion-input
            v-model="form.criasVivas"
            label="Crías vivas"
            label-placement="stacked"
            fill="outline"
            inputmode="numeric"
            :class="{ 'ion-invalid ion-touched': errores.criasVivas }"
          />
          <CampoError :mensaje="errores.criasVivas" />
        </div>
        <div class="campo">
          <ion-input
            v-model="form.criasMuertas"
            label="Crías muertas"
            label-placement="stacked"
            fill="outline"
            inputmode="numeric"
            :class="{ 'ion-invalid ion-touched': errores.criasMuertas }"
          />
          <CampoError :mensaje="errores.criasMuertas" />
        </div>
      </div>

      <div class="calculados">
        <div>
          <span class="numero">{{ valor(derivados.huevosNoEclosionados) }}</span>
          <span class="etiqueta">No eclosionados</span>
        </div>
        <div>
          <span class="numero">{{ valor(derivados.totalHuevos) }}</span>
          <span class="etiqueta">Total</span>
        </div>
        <div>
          <span class="numero">{{ valor(derivados.exitoEclosion, '%') }}</span>
          <span class="etiqueta">Éxito</span>
        </div>
        <div>
          <span class="numero">{{ valor(derivados.periodoIncubacion) }}</span>
          <span class="etiqueta">Días incubación</span>
        </div>
      </div>

      <div class="campo">
        <ion-select
          v-model="form.estatusAnalisis"
          label="Estatus del análisis"
          label-placement="stacked"
          fill="outline"
          placeholder="Selecciona"
          interface="action-sheet"
          cancel-text="Cancelar"
          :interface-options="{ header: 'Estatus del análisis' }"
        >
          <ion-select-option v-for="v in catalogos.estatusAnalisis" :key="v" :value="v">{{ v }}</ion-select-option>
        </ion-select>
      </div>

      <div class="campo">
        <ion-select
          v-model="form.perdidaNidada"
          label="Pérdida de nidada"
          label-placement="stacked"
          fill="outline"
          placeholder="Ninguna"
          interface="action-sheet"
          cancel-text="Cancelar"
          :interface-options="{ header: 'Pérdida de nidada' }"
        >
          <ion-select-option value="">Ninguna</ion-select-option>
          <ion-select-option v-for="v in catalogos.perdidaNidada" :key="v" :value="v">{{ v }}</ion-select-option>
        </ion-select>
      </div>

      <div class="campo">
        <ion-textarea
          v-model="form.observacionesNido"
          label="Observaciones del nido"
          label-placement="stacked"
          fill="outline"
          :auto-grow="true"
          :counter="true"
          :maxlength="200"
        />
      </div>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <div class="acciones">
          <ion-button expand="block" color="success" :disabled="guardando" @click="guardar">
            Guardar análisis
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
  IonInput,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import CampoError from '@/components/CampoError.vue';
import { avisar } from '@/composables/useAviso';
import { useBorrador } from '@/composables/useBorrador';
import { useCatalogos } from '@/composables/useCatalogos';
import { db } from '@/db/database';
import { actualizarNido } from '@/db/repositorio';
import { hoyISO, valor } from '@/domain/formato';
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
  if (!datos) return;
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
.campo {
  margin-bottom: 16px;
  flex: 1;
  min-width: 0;
}
.fila {
  display: flex;
  gap: 12px;
}
.calculados {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 16px;
}
.calculados div {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 2px;
  border-radius: 8px;
  background: var(--ion-color-light);
  text-align: center;
}
.numero {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ion-color-primary);
}
.etiqueta {
  font-size: 0.75rem;
  color: var(--ion-color-medium-shade);
}
.acciones {
  padding: 8px 16px;
}
</style>
