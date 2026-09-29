import { differenceInCalendarDays, parseISO } from 'date-fns';
import { fechaProbableEmergencia } from './formulas';
import type { Nido } from './schemas';

export interface AlertaEmergencia {
  nido: Nido;
  fecha: string;
  /** Días que faltan; negativo = la fecha probable ya pasó y el nido sigue sin análisis. */
  dias: number;
}

/** Nidos sin análisis cuya emergencia probable cae dentro de la ventana (o ya pasó), los más urgentes primero. */
export function proximosAEmerger(nidos: Nido[], hoy: string, ventanaDias = 7): AlertaEmergencia[] {
  return nidos
    .filter((n) => !n.deleted && !n.analisis.fechaEmergencia)
    .map((nido) => {
      const fecha = fechaProbableEmergencia(nido.fechaMuestreo);
      return { nido, fecha, dias: differenceInCalendarDays(parseISO(fecha), parseISO(hoy)) };
    })
    .filter((a) => a.dias <= ventanaDias)
    .sort((a, b) => a.dias - b.dias);
}
