import { describe, expect, it } from 'vitest';
import { decidir, jsonEstable, mismoContenido } from './consolidacion';
import { analisisVacio, type Nido } from './schemas';
import { puestaPrueba } from '@/test/fixtures';

const nido = (cambios: Partial<Nido> = {}): Nido => ({
  ...puestaPrueba(),
  id: '11111111-1111-4111-8111-111111111111',
  folio: 'B07-0001',
  temporada: 2026,
  campamentoId: 'c',
  deviceId: 'B07',
  observador: 'x',
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-01T10:00:00.000Z',
  version: 1,
  syncStatus: 'pendiente',
  deleted: false,
  analisis: analisisVacio(),
  ...cambios,
});

describe('jsonEstable', () => {
  it('no depende del orden de las llaves', () => {
    expect(jsonEstable({ b: 1, a: { d: 2, c: [1, 2] } })).toBe(jsonEstable({ a: { c: [1, 2], d: 2 }, b: 1 }));
  });
});

describe('decidir', () => {
  it('un UUID desconocido con folio libre es nuevo', () => {
    expect(decidir(nido(), undefined, undefined)).toEqual({ tipo: 'nuevo' });
  });

  it('una versión mayor actualiza y una menor se ignora', () => {
    expect(decidir(nido({ version: 3 }), nido({ version: 2 }), undefined)).toEqual({ tipo: 'actualizar' });
    expect(decidir(nido({ version: 1 }), nido({ version: 2 }), undefined)).toEqual({ tipo: 'antiguo' });
  });

  it('la misma versión con los mismos datos no cambia nada, aunque difiera el estado de entrega', () => {
    expect(decidir(nido({ syncStatus: 'entregado' }), nido(), undefined)).toEqual({ tipo: 'igual' });
    expect(mismoContenido(nido({ syncStatus: 'entregado' }), nido())).toBe(true);
  });

  it('la misma versión con datos distintos es conflicto', () => {
    expect(decidir(nido({ baliza: 20 }), nido(), undefined)).toEqual({ tipo: 'conflicto', motivo: 'misma-version' });
  });

  it('otro UUID con el mismo folio es conflicto', () => {
    const otro = nido({ id: '22222222-2222-4222-8222-222222222222' });
    expect(decidir(otro, undefined, nido())).toEqual({ tipo: 'conflicto', motivo: 'folio-duplicado' });
  });
});
