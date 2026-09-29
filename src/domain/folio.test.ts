import { describe, expect, it } from 'vitest';
import { folioConLetra, formatearFolio, parsearFolio } from './folio';

describe('folio', () => {
  it('une código de dispositivo y consecutivo con 4 dígitos', () => {
    expect(formatearFolio('B07', 12)).toBe('B07-0012');
    expect(formatearFolio('A01', 12345)).toBe('A01-12345');
  });

  it('rechaza códigos o consecutivos inválidos', () => {
    expect(() => formatearFolio('b07', 1)).toThrow();
    expect(() => formatearFolio('B7', 1)).toThrow();
    expect(() => formatearFolio('B07', 0)).toThrow();
  });

  it('busca el primer folio libre con letra', () => {
    const ocupados = new Set(['B07-0001', 'B07-0001B']);
    expect(folioConLetra('B07-0001', (f) => ocupados.has(f))).toBe('B07-0001C');
    expect(parsearFolio('B07-0001C')).toEqual({ codigoDispositivo: 'B07', consecutivo: 1 });
  });

  it('se puede leer de vuelta', () => {
    expect(parsearFolio('B07-0012')).toEqual({ codigoDispositivo: 'B07', consecutivo: 12 });
    expect(parsearFolio('12')).toBeNull();
  });
});
