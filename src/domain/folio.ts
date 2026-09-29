// Folio visible = código de dispositivo + consecutivo local (ej. B07-0012).
// Es único sin internet porque cada teléfono tiene su propio código; la llave real sigue siendo el UUID.

export const CODIGO_DISPOSITIVO_REGEX = /^[A-Z]\d{2}$/;
export const FOLIO_REGEX = /^[A-Z]\d{2}-\d{4,}$/;

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
  return { codigoDispositivo, consecutivo: Number(numero) };
}
