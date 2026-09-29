import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const hoyISO = (): string => format(new Date(), 'yyyy-MM-dd');
export const horaActual = (): string => format(new Date(), 'HH:mm');

/** '2026-09-28' → '28 sep 2026' */
export const fechaCorta = (iso: string | null | undefined): string =>
  iso ? format(parseISO(iso), 'd MMM yyyy', { locale: es }) : '—';

/** Marca de tiempo ISO → '28 sep 2026, 18:40' */
export const fechaHora = (iso: string): string => format(parseISO(iso), "d MMM yyyy, HH:mm", { locale: es });

export function textoDias(dias: number): string {
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'mañana';
  if (dias === -1) return 'ayer';
  return dias > 0 ? `en ${dias} días` : `hace ${-dias} días`;
}

export const valor = (v: string | number | null | undefined, unidad = ''): string =>
  v == null || v === '' ? '—' : `${v}${unidad}`;
