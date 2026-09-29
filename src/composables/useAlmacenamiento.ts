export interface EstadoAlmacenamiento {
  persistente: boolean;
  usadoMB: number | null;
  disponibleMB: number | null;
}

/** Pide almacenamiento persistente: el navegador no borrará la base local por falta de espacio. */
export async function solicitarPersistencia(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}

export async function estadoAlmacenamiento(): Promise<EstadoAlmacenamiento> {
  const persistente = (await navigator.storage?.persisted?.()) ?? false;
  const estimado = await navigator.storage?.estimate?.();
  const aMB = (bytes?: number) => (bytes == null ? null : Math.round((bytes / 1024 / 1024) * 10) / 10);
  return { persistente, usadoMB: aMB(estimado?.usage), disponibleMB: aMB(estimado?.quota) };
}
