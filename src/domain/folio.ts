// Folio visible = código de dispositivo + consecutivo local (ej. B07-0012).
// Es único sin internet porque cada teléfono tiene su propio código; la llave real sigue siendo el UUID.

export const CODIGO_DISPOSITIVO_REGEX = /^[A-Z]\d{2}$/;
/** La letra final opcional (B07-0001B) la pone el coordinador al conservar dos nidos con el mismo folio. */
export const FOLIO_REGEX = /^[A-Z]\d{2}-\d{4,}[B-Z]?$/;

/** Primer folio libre agregando una letra: B07-0001 → B07-0001B, B07-0001C… */
export function folioConLetra(folio: string, ocupado: (f: string) => boolean): string {
  for (const letra of 'BCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const candidato = `${folio.replace(/[B-Z]$/, '')}${letra}`;
    if (!ocupado(candidato)) return candidato;
  }
  throw new Error(`No hay folio libre para ${folio}`);
}

export function formatearFolio(codigoDispositivo: string, consecutivo: number): string {
  if (!CODIGO_DISPOSITIVO_REGEX.test(codigoDispositivo)) {
    throw new Error(`Código de dispositivo inválido: ${codigoDispositivo}`);
  }
  if (!Number.isInteger(consecutivo) || consecutivo < 1) {
    throw new Error(`Consecutivo inválido: ${consecutivo}`);
  }
  return `${codigoDispositivo}-${String(consecutivo).padStart(4, '0')}`;
}

export function parsearFolio(folio: string): { codigoDispositivo: string; consecutivo: number } | null {
  if (!FOLIO_REGEX.test(folio)) return null;
  const [codigoDispositivo, numero] = folio.split('-');
  return { codigoDispositivo, consecutivo: parseInt(numero, 10) };
}
