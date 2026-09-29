<template>
  <ion-page>
    <ion-content>
      <header class="portada">
        <div class="portada-marca">
          <img :src="logo" alt="" />
          <span>Nidos de Tortuga</span>
        </div>
        <h1 v-if="perfil">Hola, {{ primerNombre }}</h1>
        <p v-if="perfil" class="portada-datos">
          Teléfono <strong>{{ perfil.codigoDispositivo }}</strong> · Siguiente folio
          <strong>{{ siguienteFolio }}</strong>
        </p>
      </header>

      <div class="cuerpo">
        <AvisoInstalacion />

        <div class="resumen">
          <router-link to="/tabs/nidos" class="tarjeta dato">
            <ion-icon :icon="eggOutline" aria-hidden="true" />
            <span class="dato-numero">{{ conteos.total }}</span>
            <span class="dato-etiqueta">Nidos</span>
          </router-link>
          <router-link to="/tabs/nidos" class="tarjeta dato" :class="{ 'dato--aviso': conteos.sinAnalisis }">
            <ion-icon :icon="flaskOutline" aria-hidden="true" />
            <span class="dato-numero">{{ conteos.sinAnalisis }}</span>
            <span class="dato-etiqueta">Sin análisis</span>
          </router-link>
          <router-link to="/tabs/nidos" class="tarjeta dato">
            <ion-icon :icon="cloudUploadOutline" aria-hidden="true" />
            <span class="dato-numero">{{ conteos.porEntregar }}</span>
            <span class="dato-etiqueta">Por entregar</span>
          </router-link>
        </div>

        <button type="button" class="nuevo" :disabled="requiereInstalacion" @click="router.push('/nidos/nuevo')">
          <span class="nuevo-icono"><ion-icon :icon="add" aria-hidden="true" /></span>
          <span class="nuevo-texto">
            <strong>Registrar nuevo nido</strong>
            <small>Fecha, ubicación, huevos y hembra en 3 pasos</small>
          </span>
          <ion-icon :icon="chevronForward" class="nuevo-flecha" aria-hidden="true" />
        </button>

        <router-link v-if="conteos.porEntregar" to="/entrega" class="tarjeta entregar">
          <ion-icon :icon="cloudUploadOutline" aria-hidden="true" />
          <span>
            <strong>Entregar datos</strong>
            <small>
              {{ conteos.porEntregar }} {{ conteos.porEntregar === 1 ? 'nido pendiente' : 'nidos pendientes' }} de enviar
              al coordinador
            </small>
          </span>
          <ion-icon :icon="chevronForward" aria-hidden="true" />
        </router-link>

        <section v-if="alertas.length" class="alertas">
          <h2>
            <ion-icon :icon="notificationsOutline" aria-hidden="true" />
            Próximos a emerger
          </h2>
          <router-link
            v-for="a in alertas.slice(0, 5)"
            :key="a.nido.id"
            :to="`/nidos/${a.nido.id}`"
            class="tarjeta alerta"
          >
            <span class="alerta-barra" :style="{ background: colorEspecie(a.nido.especie) }" />
            <span class="alerta-texto">
              <strong>{{ a.nido.folio }}</strong>
              <small>{{ a.nido.especie }} · Baliza {{ a.nido.baliza }} · {{ fechaCorta(a.fecha) }}</small>
            </span>
            <span class="alerta-dias" :class="a.dias < 0 ? 'atrasado' : a.dias <= 2 ? 'pronto' : ''">
              {{ textoDias(a.dias) }}
            </span>
          </router-link>
          <p v-if="alertas.length > 5" class="nota">y {{ alertas.length - 5 }} más en la lista de nidos.</p>
        </section>

        <div v-else-if="conteos.total === 0" class="vacio">
          <ion-icon :icon="sunnyOutline" aria-hidden="true" />
          <p>Aún no hay nidos en este teléfono. Toca <strong>Registrar nuevo nido</strong> para empezar.</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonIcon, IonPage, useIonRouter } from '@ionic/vue';
import {
  add,
  chevronForward,
  cloudUploadOutline,
  eggOutline,
  flaskOutline,
  notificationsOutline,
  sunnyOutline,
} from 'ionicons/icons';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import AvisoInstalacion from '@/components/AvisoInstalacion.vue';
import { useInstalacion } from '@/composables/useInstalacion';
import { useLiveQuery } from '@/composables/useLiveQuery';
import { db } from '@/db/database';
import { contarNidos } from '@/db/repositorio';
import { proximosAEmerger } from '@/domain/alertas';
import { formatearFolio } from '@/domain/folio';
import { fechaCorta, hoyISO, textoDias } from '@/domain/formato';
import { usePerfilStore } from '@/stores/perfil';
import { colorEspecie } from '@/ui/colores';

const logo = `${import.meta.env.BASE_URL}logo.svg`;
const router = useIonRouter();
const { requiereInstalacion } = useInstalacion();
const { perfil } = storeToRefs(usePerfilStore());

const primerNombre = computed(() => perfil.value?.observador.split(' ')[0] ?? '');
const siguienteFolio = computed(() =>
  perfil.value ? formatearFolio(perfil.value.codigoDispositivo, perfil.value.siguienteConsecutivo) : '',
);

const conteos = useLiveQuery(() => contarNidos(), { total: 0, sinAnalisis: 0, porEntregar: 0 });
const alertas = useLiveQuery(async () => proximosAEmerger(await db.nidos.toArray(), hoyISO()), []);
</script>

<style scoped>
.portada {
  background: linear-gradient(160deg, #0f766e 0%, #115e59 100%);
  color: #ffffff;
  padding: calc(20px + env(safe-area-inset-top)) 20px 56px;
}
.portada-marca {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  opacity: 0.95;
}
.portada-marca img {
  width: 32px;
  height: 32px;
  border-radius: 9px;
}
.portada h1 {
  margin: 20px 0 4px;
  font-size: 1.75rem;
  font-weight: 800;
}
.portada-datos {
  margin: 0;
  opacity: 0.9;
}
.cuerpo {
  padding: 0 16px 24px;
  margin-top: -40px;
}
.resumen {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}
.dato {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px;
  text-decoration: none;
  color: var(--app-texto);
}
.dato ion-icon {
  font-size: 1.3rem;
  color: var(--ion-color-primary);
  margin-bottom: 4px;
}
.dato--aviso ion-icon,
.dato--aviso .dato-numero {
  color: var(--ion-color-warning);
}
.dato-numero {
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1;
}
.dato-etiqueta {
  font-size: 0.8rem;
  color: var(--app-texto-suave);
  font-weight: 600;
}
.nuevo {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 0;
  border-radius: var(--app-radio);
  background: var(--ion-color-primary);
  color: #ffffff;
  text-align: left;
  box-shadow: 0 6px 16px rgba(15, 118, 110, 0.3);
  cursor: pointer;
}
.nuevo:active {
  background: var(--ion-color-primary-shade);
}
.nuevo:disabled {
  opacity: 0.5;
  box-shadow: none;
}
.nuevo-icono {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}
.nuevo-texto {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nuevo-texto strong {
  font-size: 1.15rem;
}
.nuevo-texto small {
  font-size: 0.85rem;
  opacity: 0.9;
}
.nuevo-flecha {
  font-size: 1.4rem;
}
.entregar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 14px;
  text-decoration: none;
  color: var(--app-texto);
  border-left: 5px solid var(--ion-color-warning);
}
.entregar > ion-icon:first-child {
  flex: none;
  font-size: 1.8rem;
  color: var(--ion-color-warning);
}
.entregar > ion-icon:last-child {
  color: var(--app-borde);
  font-size: 1.3rem;
}
.entregar span {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.entregar strong {
  font-size: 1.05rem;
}
.entregar small {
  color: var(--app-texto-suave);
  font-size: 0.85rem;
}
.alertas h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 750;
  margin: 26px 2px 10px;
}
.alertas h2 ion-icon {
  color: var(--ion-color-primary);
}
.alerta {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px 12px 0;
  margin-bottom: 8px;
  overflow: hidden;
  text-decoration: none;
  color: var(--app-texto);
}
.alerta-barra {
  align-self: stretch;
  width: 5px;
  margin: -12px 0;
}
.alerta-texto {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.alerta-texto strong {
  font-size: 1.05rem;
}
.alerta-texto small {
  color: var(--app-texto-suave);
  font-size: 0.85rem;
}
.alerta-dias {
  flex: none;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  background: var(--ion-background-color);
  color: var(--app-texto-suave);
}
.alerta-dias.pronto {
  background: var(--app-aviso-suave);
  color: var(--ion-color-warning-shade);
}
.alerta-dias.atrasado {
  background: var(--app-error-suave);
  color: var(--ion-color-danger);
}
.nota {
  color: var(--app-texto-suave);
  font-size: 0.875rem;
  margin: 4px 2px;
}
.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  margin-top: 40px;
  padding: 0 24px;
  color: var(--app-texto-suave);
}
.vacio ion-icon {
  font-size: 3rem;
  color: var(--ion-color-warning);
}
</style>
