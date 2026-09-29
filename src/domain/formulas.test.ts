import { describe, expect, it } from 'vitest';
import {
  calcularDerivados,
  exitoEclosion,
  fechaProbableEmergencia,
  huevosNoEclosionados,
  periodoIncubacion,
  totalHuevos,
} from './formulas';
import { analisisVacio } from './schemas';

describe('fechaProbableEmergencia', () => {
  it('suma 45 días a la fecha de muestreo', () => {
    expect(fechaProbableEmergencia('2026-09-28')).toBe('2026-11-12');
  });

  it('cruza meses y años', () => {
    expect(fechaProbableEmergencia('2026-12-10')).toBe('2027-01-24');
  });

  it('acepta días de incubación por especie', () => {
    expect(fechaProbableEmergencia('2026-06-01', 60)).toBe('2026-07-31');
  });
});

describe('periodoIncubacion', () => {
  it('cuenta los días entre muestreo y emergencia', () => {
    expect(periodoIncubacion('2026-06-01', '2026-07-20')).toBe(49);
  });

  it('es null si todavía no hay emergencia', () => {
    expect(periodoIncubacion('2026-06-01', null)).toBeNull();
  });
});

describe('conteo de huevos', () => {
  it('no eclosionados = sin desarrollo + desarrollo aparente', () => {
    expect(huevosNoEclosionados(7, 5)).toBe(12);
    expect(huevosNoEclosionados(7, null)).toBeNull();
  });

  it('total = eclosionados + no eclosionados', () => {
    expect(totalHuevos(88, 12)).toBe(100);
    expect(totalHuevos(null, 12)).toBeNull();
  });

  it('éxito de eclosión con un decimal', () => {
    expect(exitoEclosion(88, 100)).toBe(88);
    expect(exitoEclosion(2, 3)).toBe(66.7);
  });

  it('éxito de eclosión es null si el total es 0 o falta', () => {
    expect(exitoEclosion(0, 0)).toBeNull();
    expect(exitoEclosion(5, null)).toBeNull();
  });
});

describe('calcularDerivados', () => {
  it('calcula todo a partir del análisis', () => {
    const analisis = {
      ...analisisVacio(),
      fechaEmergencia: '2026-07-20',
      huevosEclosionados: 90,
      huevosSinDesarrollo: 6,
      huevosConDesarrolloAparente: 4,
    };
    expect(calcularDerivados('2026-06-01', analisis)).toEqual({
      fechaProbableEmergencia: '2026-07-16',
      periodoIncubacion: 49,
      huevosNoEclosionados: 10,
      totalHuevos: 100,
      exitoEclosion: 90,
    });
  });

  it('deja en null lo que aún no se puede calcular', () => {
    const d = calcularDerivados('2026-06-01', analisisVacio());
    expect(d.fechaProbableEmergencia).toBe('2026-07-16');
    expect(d.periodoIncubacion).toBeNull();
    expect(d.totalHuevos).toBeNull();
    expect(d.exitoEclosion).toBeNull();
  });
});
