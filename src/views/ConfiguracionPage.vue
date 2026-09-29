<template>
  <ion-page>
    <ion-header v-if="editando">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/ajustes" text="" />
        </ion-buttons>
        <ion-title>Editar perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="!editando" class="bienvenida">
        <img :src="logo" alt="" class="bienvenida-logo" />
        <h1>Nidos de Tortuga</h1>
        <p>Configura este teléfono una sola vez. Tus datos acompañan a cada nido que registres.</p>
      </div>

      <TarjetaSeccion titulo="Tus datos" :icono="personOutline">
        <CampoForm etiqueta="Tu nombre" :error="errores.observador">
          <EntradaTexto
            v-model="form.observador"
            etiqueta="Tu nombre"
            ejemplo="Ej. Ana López"
            mayusculas="words"
            :maximo="50"
            :invalido="!!errores.observador"
          />
        </CampoForm>
        <CampoForm etiqueta="Brigada" :error="errores.brigada">
          <EntradaTexto
            v-model="form.brigada"
            etiqueta="Brigada"
            ejemplo="Ej. Brigada 3"
            :maximo="30"
            :invalido="!!errores.brigada"
          />
        </CampoForm>
        <CampoForm v-slot="{ idEtiqueta }" etiqueta="Rol">
          <SelectorOpciones
            :model-value="form.rol === 'coordinador' ? 'Coordinador' : 'Observador'"
            :opciones="['Observador', 'Coordinador']"
            :etiquetado-por="idEtiqueta"
            @update:model-value="form.rol = $event === 'Coordinador' ? 'coordinador' : 'observador'"
          />
        </CampoForm>
      </TarjetaSeccion>

      <TarjetaSeccion titulo="Este teléfono" :icono="phonePortraitOutline">
        <CampoForm
          etiqueta="Código del teléfono"
          ayuda="Lo asigna el coordinador: una letra y dos números. Va al inicio de cada folio."
          :error="errores.codigoDispositivo"
        >
          <EntradaTexto
            :model-value="form.codigoDispositivo"
            etiqueta="Código del teléfono"
            ejemplo="Ej. B07"
            mayusculas="characters"
            :maximo="3"
            :invalido="!!errores.codigoDispositivo"
            @update:model-value="form.codigoDispositivo = $event.toUpperCase()"
          />
        </CampoForm>
        <div v-if="/^[A-Z]\d{2}$/.test(form.codigoDispositivo)" class="ejemplo-folio">
          Tus folios se verán así: <strong>{{ form.codigoDispositivo }}-0001</strong>
        </div>
        <p v-if="cambiaCodigo" class="aviso">
          <ion-icon :icon="warningOutline" aria-hidden="true" />
          Cambiar el código afecta solo a los nidos nuevos. Avisa al coordinador para que no se repita en otro teléfono.
        </p>
        <p class="campamento">
          <ion-icon :icon="flagOutline" aria-hidden="true" />
          {{ CAMPAMENTO.nombre }}
        </p>
      </TarjetaSeccion>
    </ion-content>

    <ion-footer class="pie">
      <div class="acciones">
        <ion-button expand="block" :disabled="guardando" @click="guardar">
          {{ editando ? 'Guardar cambios' : 'Empezar a registrar' }}
          <ion-icon slot="end" :icon="editando ? checkmarkCircle : arrowForward" />
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
  arrowForward,
  checkmarkCircle,
  flagOutline,
  personOutline,
  phonePortraitOutline,
  warningOutline,
} from 'ionicons/icons';
import { computed, reactive, ref } from 'vue';
import TarjetaSeccion from '@/components/TarjetaSeccion.vue';
import CampoForm from '@/components/form/CampoForm.vue';
import EntradaTexto from '@/components/form/EntradaTexto.vue';
import SelectorOpciones from '@/components/form/SelectorOpciones.vue';
import { avisar } from '@/composables/useAviso';
import { perfilSchema, type Perfil } from '@/domain/schemas';
import { CAMPAMENTO, usePerfilStore } from '@/stores/perfil';

const logo = `${import.meta.env.BASE_URL}logo.svg`;
const store = usePerfilStore();
const router = useIonRouter();
const anterior = store.perfil;
const editando = anterior != null;

const form = reactive({
  observador: anterior?.observador ?? '',
  brigada: anterior?.brigada ?? '',
  codigoDispositivo: anterior?.codigoDispositivo ?? '',
  rol: anterior?.rol ?? ('observador' as Perfil['rol']),
});

const intentado = ref(false);
const guardando = ref(false);

const perfilNuevo = computed(() => ({
  ...form,
  observador: form.observador.trim(),
  brigada: form.brigada.trim(),
  campamentoId: CAMPAMENTO.id,
  siguienteConsecutivo: anterior?.siguienteConsecutivo ?? 1,
}));

const errores = computed<Partial<Record<string, string>>>(() => {
  if (!intentado.value) return {};
  const r = perfilSchema.safeParse(perfilNuevo.value);
  if (r.success) return {};
  const e: Record<string, string> = {};
  for (const issue of r.error.issues) e[String(issue.path[0])] ??= issue.message;
  return e;
});

const cambiaCodigo = computed(
  () => editando && form.codigoDispositivo.length === 3 && form.codigoDispositivo !== anterior?.codigoDispositivo,
);

async function guardar() {
  intentado.value = true;
  const r = perfilSchema.safeParse(perfilNuevo.value);
  if (!r.success) return;
  guardando.value = true;
  try {
    await store.guardar(r.data);
    if (editando) {
      await avisar('Perfil actualizado');
      router.back();
    } else {
      router.replace('/tabs/inicio');
    }
  } finally {
    guardando.value = false;
  }
}
</script>

<style scoped>
.bienvenida {
  text-align: center;
  padding: 24px 12px 20px;
}
.bienvenida-logo {
  width: 88px;
  height: 88px;
  border-radius: 22px;
  box-shadow: var(--app-sombra);
}
.bienvenida h1 {
  margin: 16px 0 6px;
  font-size: 1.6rem;
  font-weight: 800;
}
.bienvenida p {
  margin: 0;
  color: var(--app-texto-suave);
  font-size: 1rem;
  line-height: 1.4;
}
.ejemplo-folio {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--app-primario-suave);
  color: var(--app-texto);
}
.ejemplo-folio strong {
  color: var(--ion-color-primary-shade);
  font-size: 1.05rem;
}
.aviso,
.campamento {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 12px 2px 0;
  font-size: 0.9rem;
}
.aviso {
  color: var(--ion-color-warning-shade);
  font-weight: 600;
}
.campamento {
  color: var(--app-texto-suave);
}
.aviso ion-icon,
.campamento ion-icon {
  flex: none;
  font-size: 1.15rem;
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
