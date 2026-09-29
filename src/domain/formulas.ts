import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import type { EtapaAnalisis } from './schemas';

// Campos calculados: nunca se capturan a mano. Las fechas van en ISO (AAAA-MM-DD)
// para no depender del idioma del teléfono.

export const DIAS_INCUBACION_DEFAULT = 45;

const aISO = (fecha: Date) => format(fecha, 'yyyy-MM-dd');

/** Fecha de muestreo + días de incubación (45 por defecto; configurable por especie). */
export function fechaProbableEmergencia(fechaMuestreo: string, dias = DIAS_INCUBACION_DEFAULT): string {
  return aISO(addDays(parseISO(fechaMuestreo), dias));
}

/** Días entre el muestreo y la emergencia; null si aún no hay emergencia. */
export function periodoIncubacion(fechaMuestreo: string, fechaEmergencia: string | null): number | null {
  if (!fechaEmergencia) return null;
  return differenceInCalendarDays(parseISO(fechaEmergencia), parseISO(fechaMuestreo));
}

/** Huevos sin desarrollo + huevos con desarrollo aparente. */
export function huevosNoEclosionados(sinDesarrollo: number | null, conDesarrolloAparente: number | null): number | null {
  if (sinDesarrollo == null || conDesarrolloAparente == null) return null;
  return sinDesarrollo + conDesarrolloAparente;
}

/** Eclosionados + no eclosionados. */
export function totalHuevos(eclosionados: number | null, noEclosionados: number | null): number | null {
  if (eclosionados == null || noEclosionados == null) return null;
  return eclosionados + noEclosionados;
}

/** Eclosionados × 100 / total, con un decimal; null si no hay total. */
export function exitoEclosion(eclosionados: number | null, total: number | null): number | null {
  if (eclosionados == null || total == null || total === 0) return null;
  return Math.round((eclosionados * 1000) / total) / 10;
}

export interface Derivados {
  fechaProbableEmergencia: string;
  periodoIncubacion: number | null;
  huevosNoEclosionados: number | null;
  totalHuevos: number | null;
  exitoEclosion: number | null;
}

export function calcularDerivados(
  fechaMuestreo: string,
  analisis: EtapaAnalisis,
  diasIncubacion = DIAS_INCUBACION_DEFAULT,
): Derivados {
  const noEclosionados = huevosNoEclosionados(analisis.huevosSinDesarrollo, analisis.huevosConDesarrolloAparente);
  const total = totalHuevos(analisis.huevosEclosionados, noEclosionados);
  return {
    fechaProbableEmergencia: fechaProbableEmergencia(fechaMuestreo, diasIncubacion),
    periodoIncubacion: periodoIncubacion(fechaMuestreo, analisis.fechaEmergencia),
    huevosNoEclosionados: noEclosionados,
    totalHuevos: total,
    exitoEclosion: exitoEclosion(analisis.huevosEclosionados, total),
  };
}
