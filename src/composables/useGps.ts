import { onUnmounted, ref } from 'vue';

export interface LecturaGps {
  lat: number;
  lng: number;
  /** Radio de error en metros. */
  precision: number;
}

/** Con esta precisión dejamos de buscar; si no se alcanza, nos quedamos con la mejor lectura. */
const PRECISION_OBJETIVO_M = 10;
const TIEMPO_MAXIMO_MS = 30_000;

const redondear6 = (n: number) => Math.round(n * 1e6) / 1e6; // ~0.1 m

function mensajeError(e: GeolocationPositionError): string {
  switch (e.code) {
    case e.PERMISSION_DENIED:
      return 'Permiso de ubicación negado. Actívalo en los ajustes del navegador o escribe las coordenadas.';
    case e.POSITION_UNAVAILABLE:
      return 'No hay señal de GPS. Intenta en un lugar abierto o escribe las coordenadas.';
    default:
      return 'El GPS tardó demasiado. Intenta de nuevo o escribe las coordenadas.';
  }
}

/**
 * Busca la ubicación con el GPS del teléfono (no necesita internet). Mantiene la mejor lectura
 * hasta llegar a ±10 m o a los 30 s.
 */
export function useGps() {
  const estado = ref<'inactivo' | 'buscando' | 'listo' | 'error'>('inactivo');
  const error = ref('');
  const lectura = ref<LecturaGps | null>(null);

  let watchId: number | null = null;
  let limite: ReturnType<typeof setTimeout> | null = null;

  function limpiar() {
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    if (limite) clearTimeout(limite);
    watchId = null;
    limite = null;
  }

  function terminar() {
    limpiar();
    if (estado.value !== 'buscando') return;
    estado.value = lectura.value ? 'listo' : 'error';
    if (!lectura.value && !error.value) {
      error.value = 'No se obtuvo señal de GPS. Intenta en un lugar abierto o escribe las coordenadas.';
    }
  }

  function buscar() {
    if (!('geolocation' in navigator)) {
      estado.value = 'error';
      error.value = 'Este dispositivo no tiene GPS disponible. Escribe las coordenadas.';
      return;
    }
    limpiar();
    estado.value = 'buscando';
    error.value = '';
    lectura.value = null;

    watchId = navigator.geolocation.watchPosition(
      (p) => {
        const nueva = {
          lat: redondear6(p.coords.latitude),
          lng: redondear6(p.coords.longitude),
          precision: Math.round(p.coords.accuracy),
        };
        if (!lectura.value || nueva.precision < lectura.value.precision) lectura.value = nueva;
        if (nueva.precision <= PRECISION_OBJETIVO_M) terminar();
      },
      (e) => {
        error.value = mensajeError(e);
        terminar();
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: TIEMPO_MAXIMO_MS },
    );
    limite = setTimeout(terminar, TIEMPO_MAXIMO_MS);
  }

  onUnmounted(limpiar);

  return { estado, error, lectura, buscar, detener: terminar };
}
