import type { Nido } from './schemas';

// Reglas para juntar nidos que llegan de otros teléfonos (archivo o servidor).
// Las usan por igual el modo coordinador y la API: por eso solo importan rutas relativas.

export type Decision =
  | { tipo: 'nuevo' }
  | { tipo: 'actualizar' }
  | { tipo: 'igual' }
  | { tipo: 'antiguo' }
  | { tipo: 'conflicto'; motivo: 'misma-version' | 'folio-duplicado' };

/** JSON con llaves ordenadas: dos nidos iguales dan el mismo texto aunque sus llaves vengan en otro orden. */
export function jsonEstable(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(jsonEstable).join(',')}]`;
  if (valor && typeof valor === 'object') {
    const obj = valor as Record<string, unknown>;
    return `{${Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${jsonEstable(obj[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(valor);
}

/**
 * El estado de entrega es de cada teléfono, y el folio lo puede cambiar el coordinador (B07-0001 → B07-0001B)
 * al conservar dos nidos con el mismo folio. Ninguno cuenta como diferencia de datos: la identidad es el UUID.
 */
export function mismoContenido(a: Nido, b: Nido): boolean {
  const { syncStatus: _sa, folio: _fa, ...restoA } = a;
  const { syncStatus: _sb, folio: _fb, ...restoB } = b;
  return jsonEstable(restoA) === jsonEstable(restoB);
}

/** Al actualizar un nido ya conocido se respeta el folio que tiene guardado. */
export const conFolioDe = (entrante: Nido, guardado: Nido): Nido => ({ ...entrante, folio: guardado.folio });

/**
 * Qué hacer con un nido entrante.
 * @param porId   el nido guardado con el mismo UUID, si existe
 * @param porFolio el nido guardado con el mismo folio, si existe
 */
export function decidir(entrante: Nido, porId: Nido | undefined, porFolio: Nido | undefined): Decision {
  if (porId) {
    if (entrante.version > porId.version) return { tipo: 'actualizar' };
    if (entrante.version < porId.version) return { tipo: 'antiguo' };
    return mismoContenido(entrante, porId) ? { tipo: 'igual' } : { tipo: 'conflicto', motivo: 'misma-version' };
  }
  if (porFolio) return { tipo: 'conflicto', motivo: 'folio-duplicado' };
  return { tipo: 'nuevo' };
}
