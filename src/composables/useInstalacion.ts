import { computed, onMounted, onUnmounted, ref } from 'vue';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const esIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const estaInstalada = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * En iPhone la app DEBE estar instalada en la pantalla de inicio: Safari puede borrar los datos
 * de una web abierta en pestaña tras 7 días sin uso, pero no los de una app instalada.
 */
export function useInstalacion() {
  const ios = esIOS();
  const instalada = ref(estaInstalada());
  const eventoInstalar = ref<BeforeInstallPromptEvent | null>(null);

  const alCapturarEvento = (e: Event) => {
    e.preventDefault();
    eventoInstalar.value = e as BeforeInstallPromptEvent;
  };
  const alInstalar = () => {
    instalada.value = true;
    eventoInstalar.value = null;
  };

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', alCapturarEvento);
    window.addEventListener('appinstalled', alInstalar);
  });
  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', alCapturarEvento);
    window.removeEventListener('appinstalled', alInstalar);
  });

  async function instalar() {
    if (!eventoInstalar.value) return;
    await eventoInstalar.value.prompt();
    await eventoInstalar.value.userChoice;
    eventoInstalar.value = null;
  }

  return {
    ios,
    instalada,
    /** Captura bloqueada: iPhone con la app abierta en una pestaña de Safari. */
    requiereInstalacion: computed(() => ios && !instalada.value),
    puedeInstalar: computed(() => eventoInstalar.value !== null),
    instalar,
  };
}
