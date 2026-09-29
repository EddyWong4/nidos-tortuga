<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/ajustes" text="" />
        </ion-buttons>
        <ion-title>Ayuda</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <TarjetaSeccion titulo="Instalar la app" :icono="downloadOutline">
        <h3><ion-icon :icon="logoAndroid" aria-hidden="true" /> Android (Chrome)</h3>
        <ol>
          <li>Abre <strong>{{ url }}</strong> en Chrome.</li>
          <li>Toca <strong>Instalar app</strong> o el menú <strong>⋮</strong> → <strong>Instalar aplicación</strong>.</li>
          <li>Abre la app desde el ícono de la tortuga.</li>
        </ol>
        <h3><ion-icon :icon="logoApple" aria-hidden="true" /> iPhone (Safari)</h3>
        <ol>
          <li>Abre <strong>{{ url }}</strong> en <strong>Safari</strong> (no en otro navegador).</li>
          <li>Toca <strong>Compartir</strong> (cuadro con flecha) → <strong>Agregar a pantalla de inicio</strong>.</li>
          <li>Abre la app desde el ícono. <strong>Es obligatorio</strong>: en una pestaña de Safari los datos se pueden borrar.</li>
        </ol>
        <p class="nota">La primera vez se necesita internet. Después funciona sin señal.</p>
      </TarjetaSeccion>

      <TarjetaSeccion titulo="Registrar un nido" :icono="eggOutline">
        <ol>
          <li>En Inicio toca <strong>Registrar nuevo nido</strong>.</li>
          <li><strong>Paso 1:</strong> fecha, especie, municipio, baliza y ubicación. El GPS funciona sin internet; en un lugar abierto tarda menos.</li>
          <li><strong>Paso 2:</strong> zona, hora, huevos e incubación.</li>
          <li><strong>Paso 3:</strong> datos de la hembra (opcionales) y <strong>Guardar nido</strong>.</li>
        </ol>
        <p class="nota">Si se cierra la app a la mitad, al volver recupera lo que llevabas.</p>
      </TarjetaSeccion>

      <TarjetaSeccion titulo="Registrar el análisis" :icono="flaskOutline">
        <p>Días después de la emergencia abre el nido desde la lista y toca <strong>Registrar análisis</strong>. En Inicio aparecen los nidos próximos a emerger.</p>
      </TarjetaSeccion>

      <TarjetaSeccion titulo="Entregar los datos" :icono="shareSocialOutline">
        <ol>
          <li>En Inicio toca <strong>Entregar datos</strong>.</li>
          <li>Toca <strong>Generar y compartir</strong> y mándalo al coordinador por WhatsApp o correo.</li>
          <li>El coordinador lo abre en su app, en la pestaña <strong>Coordinación</strong> → <strong>Elegir archivos</strong>.</li>
        </ol>
        <p class="nota">El archivo lleva solo lo nuevo o modificado. Entregar dos veces no duplica nada.</p>
      </TarjetaSeccion>

      <TarjetaSeccion titulo="Preguntas frecuentes" :icono="helpCircleOutline">
        <details>
          <summary>¿Qué pasa si pierdo o se rompe el teléfono?</summary>
          <p>Se pierde lo que no se haya entregado. Por eso conviene entregar al final de cada turno. En Ajustes → Respaldos puedes guardar una copia completa en un archivo.</p>
        </details>
        <details>
          <summary>El GPS no encuentra señal</summary>
          <p>Sal a un lugar abierto, lejos de techos, y toca <strong>Volver a medir</strong>. Si no funciona, escribe las coordenadas a mano: quedan marcadas como escritas a mano.</p>
        </details>
        <details>
          <summary>Me equivoqué en un dato</summary>
          <p>Abre el nido y toca <strong>Editar puesta</strong> o <strong>Editar análisis</strong>. El cambio se incluye en la siguiente entrega.</p>
        </details>
        <details>
          <summary>Apareció "Hay una versión nueva"</summary>
          <p>Termina lo que estés capturando y toca <strong>Actualizar</strong>. Tus datos no se borran.</p>
        </details>
      </TarjetaSeccion>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import {
  downloadOutline,
  eggOutline,
  flaskOutline,
  helpCircleOutline,
  logoAndroid,
  logoApple,
  shareSocialOutline,
} from 'ionicons/icons';
import TarjetaSeccion from '@/components/TarjetaSeccion.vue';
import { URL_APP } from '@/ui/app';

const url = URL_APP.replace(/^https:\/\//, '');
</script>

<style scoped>
h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  margin: 4px 0 6px;
}
h3:not(:first-child) {
  margin-top: 16px;
}
ol {
  margin: 0;
  padding-left: 1.3rem;
  line-height: 1.55;
}
li {
  margin-bottom: 4px;
}
p {
  margin: 0;
  line-height: 1.5;
}
.nota {
  margin-top: 10px;
  font-size: 0.875rem;
  color: var(--app-texto-suave);
}
details {
  border-top: 1px solid var(--app-borde-suave);
  padding: 12px 0;
}
details:first-child {
  border-top: 0;
  padding-top: 0;
}
summary {
  font-weight: 650;
  cursor: pointer;
}
details p {
  margin-top: 8px;
  color: var(--app-texto-suave);
}
</style>
