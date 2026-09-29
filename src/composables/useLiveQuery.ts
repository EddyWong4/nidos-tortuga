import { liveQuery } from 'dexie';
import { onUnmounted, shallowRef, type ShallowRef } from 'vue';

/** Resultado de una consulta a Dexie que se actualiza solo cuando cambian los datos. */
export function useLiveQuery<T>(consulta: () => Promise<T>, inicial: T): ShallowRef<T> {
  const valor = shallowRef(inicial) as ShallowRef<T>;
  const suscripcion = liveQuery(consulta).subscribe({
    next: (v) => (valor.value = v),
    error: (e) => console.error('Error en consulta local', e),
  });
  onUnmounted(() => suscripcion.unsubscribe());
  return valor;
}
