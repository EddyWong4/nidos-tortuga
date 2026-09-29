import { describe, expect, it } from 'vitest';
import { etapaPuestaSchema, perfilSchema } from './schemas';
import { perfilPrueba, puestaPrueba } from '@/test/fixtures';

const mensajes = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.success ? [] : r.error!.issues.map((i) => i.message);

describe('etapaPuestaSchema', () => {
  it('acepta una puesta completa', () => {
    expect(etapaPuestaSchema.safeParse(puestaPrueba()).success).toBe(true);
  });

  it('da mensajes claros en español en lugar de cerrar la app', () => {
    const r = etapaPuestaSchema.safeParse(puestaPrueba({ baliza: 40, especie: '' }));
    expect(mensajes(r)).toEqual(expect.arrayContaining(['Debe ser de 1 a 31', 'Selecciona la especie']));
  });

  it('rechaza fechas que no están en formato ISO', () => {
    expect(etapaPuestaSchema.safeParse(puestaPrueba({ fechaMuestreo: '01/06/2026' })).success).toBe(false);
  });

  it('permite omitir los datos de la hembra', () => {
    const hembra = { largoCurvoCm: null, anchoCurvoCm: null, placa: null, observaciones: null };
    expect(etapaPuestaSchema.safeParse(puestaPrueba({ hembra })).success).toBe(true);
  });
});

describe('perfilSchema', () => {
  it('exige un código de dispositivo como B07', () => {
    expect(perfilSchema.safeParse(perfilPrueba()).success).toBe(true);
    expect(perfilSchema.safeParse(perfilPrueba({ codigoDispositivo: 'B7' })).success).toBe(false);
  });
});
