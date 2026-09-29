<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons v-if="editando" slot="start">
          <ion-back-button default-href="/tabs/ajustes" text="" />
        </ion-buttons>
        <ion-title>{{ editando ? 'Editar perfil' : 'Configurar este teléfono' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <p v-if="!editando" class="intro">
        Se hace una sola vez. Estos datos acompañan a cada nido que captures en este teléfono.
      </p>

      <div class="campo">
        <ion-input
          v-model="form.observador"
          label="Tu nombre"
          label-placement="stacked"
          fill="outline"
          autocapitalize="words"
          :maxlength="50"
          :class="{ 'ion-invalid ion-touched': errores.observador }"
        />
        <CampoError :mensaje="errores.observador" />
      </div>

      <div class="campo">
        <ion-input
          v-model="form.brigada"
          label="Brigada"
          label-placement="stacked"
          fill="outline"
          placeholder="Ej. Brigada 3"
          :maxlength="30"
          :class="{ 'ion-invalid ion-touched': errores.brigada }"
        />
        <CampoError :mensaje="errores.brigada" />
      </div>

      <div class="campo">
        <ion-input
          v-model="form.codigoDispositivo"
          label="Código del teléfono"
          label-placement="stacked"
          fill="outline"
          placeholder="Ej. B07"
          helper-text="Lo asigna el coordinador. Va al inicio de cada folio: B07-0001."
          autocapitalize="characters"
          :maxlength="3"
          :class="{ 'ion-invalid ion-touched': errores.codigoDispositivo }"
          @ion-input="form.codigoDispositivo = String($event.detail.value ?? '').toUpperCase()"
        />
        <CampoError :mensaje="errores.codigoDispositivo" />
        <p v-if="cambiaCodigo" class="aviso">
          Cambiar el código afecta solo a los nidos nuevos. Avisa al coordinador para que no se repita en otro
          teléfono.
        </p>
      </div>

      <div class="campo">
        <ion-select
          v-model="form.rol"
          label="Rol"
          label-placement="stacked"
          fill="outline"
          interface="action-sheet"
          cancel-text="Cancelar"
        >
          <ion-select-option value="observador">Observador</ion-select-option>
          <ion-select-option value="coordinador">Coordinador</ion-select-option>
        </ion-select>
      </div>

      <p class="campamento">Campamento: {{ CAMPAMENTO.nombre }}</p>

      <ion-button expand="block" size="large" :disabled="guardando" @click="guardar">
        {{ editando ? 'Guardar cambios' : 'Empezar' }}
      </ion-button>
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
  IonInput,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/vue';
import { computed, reactive, ref } from 'vue';
import CampoError from '@/components/CampoError.vue';
import { avisar } from '@/composables/useAviso';
import { perfilSchema, type Perfil } from '@/domain/schemas';
import { CAMPAMENTO, usePerfilStore } from '@/stores/perfil';

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
.intro {
  color: var(--ion-color-medium-shade);
  margin-top: 0;
}
.campo {
  margin-bottom: 16px;
}
.aviso {
  color: var(--ion-color-warning-shade);
  font-size: 0.875rem;
  margin: 6px 4px 0;
}
.campamento {
  color: var(--ion-color-medium-shade);
  font-size: 0.875rem;
  margin: 8px 4px 24px;
}
</style>
