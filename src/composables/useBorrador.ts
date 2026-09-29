import { onUnmounted, watch } from 'vue';
import { db } from '@/db/database';

const ESPERA_MS = 500;

/**
 * Guarda automáticamente un formulario a medio llenar: cerrar la app o quedarse sin batería no pierde nada.
 * Se activa después de restaurar, para no pisar un borrador existente con el formulario vacío.
 */
export function useBorrador<T extends object>(id: string, nidoId: string | null, datos: T) {
  let activo = false;
  let pendiente: ReturnType<typeof setTimeout> | null = null;

  async function guardarAhora() {
    if (pendiente) clearTimeout(pendiente);
    pendiente = null;
    if (!activo) return;
    await db.borradores.put({
      id,
      nidoId,
      datos: JSON.parse(JSON.stringify(datos)),
      updatedAt: new Date().toISOString(),
    });
  }

  watch(
    () => JSON.stringify(datos),
    () => {
      if (!activo) return;
      if (pendiente) clearTimeout(pendiente);
      pendiente = setTimeout(() => void guardarAhora(), ESPERA_MS);
    },
  );

  onUnmounted(() => {
    if (pendiente) void guardarAhora();
  });

  return {
    async recuperar(): Promise<T | null> {
      const borrador = await db.borradores.get(id);
      return borrador ? (borrador.datos as T) : null;
    },
    activar() {
      activo = true;
    },
    /** Tras guardar el nido (o al descartar): el borrador ya no hace falta. */
    async descartar() {
      activo = false;
      if (pendiente) clearTimeout(pendiente);
      pendiente = null;
      await db.borradores.delete(id);
    },
  };
}
