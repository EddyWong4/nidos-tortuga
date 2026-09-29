import { describe, expect, it } from 'vitest';
import {
  aNumero,
  analisisAFormulario,
  formularioPuestaVacio,
  puestaAFormulario,
  validarAnalisis,
  validarPuesta,
} from './formulario';
import { analisisVacio } from './schemas';
import { puestaPrueba } from '@/test/fixtures';

describe('aNumero', () => {
  it('acepta coma o punto decimal', () => {
    expect(aNumero('98,5')).toBe(98.5);
    expect(aNumero(' 98.5 ')).toBe(98.5);
  });

  it('vacío es null y texto inválido es NaN', () => {
    expect(aNumero('  ')).toBeNull();
    expect(aNumero('12abc')).toBeNaN();
  });
});

describe('validarPuesta', () => {
  it('ida y vuelta: una puesta válida sobrevive al formulario', () => {
    const puesta = puestaPrueba();
    const { datos, errores } = validarPuesta(puestaAFormulario(puesta));
    expect(errores).toEqual({});
    expect(datos).toEqual(puesta);
  });

  it('un formulario vacío dice qué falta, campo por campo', () => {
    const { datos, errores } = validarPuesta(formularioPuestaVacio());
    expect(datos).toBeNull();
    expect(errores.baliza).toBe('Este dato es obligatorio');
    expect(errores.especie).toBe('Selecciona la especie');
    expect(errores.lat).toBe('Este dato es obligatorio');
    expect(errores.largoCurvoCm).toBeUndefined();
  });

  it('marca números inválidos sin cerrar la app', () => {
    const f = puestaAFormulario(puestaPrueba());
    const { errores } = validarPuesta({ ...f, baliza: 'doce', largoCurvoCm: '98,5x' });
    expect(errores.baliza).toBe('Escribe solo números');
    expect(errores.largoCurvoCm).toBe('Escribe solo números');
  });

  it('acepta coma decimal y pone la placa en mayúsculas', () => {
    const f = puestaAFormulario(puestaPrueba());
    const { datos } = validarPuesta({ ...f, largoCurvoCm: '98,5', placa: 'mx1234' });
    expect(datos?.hembra.largoCurvoCm).toBe(98.5);
    expect(datos?.hembra.placa).toBe('MX1234');
  });

  it('asigna los errores de la hembra a sus campos del formulario', () => {
    const f = puestaAFormulario(puestaPrueba());
    const { errores } = validarPuesta({ ...f, placa: 'con espacios' });
    expect(errores.placa).toBe('La placa lleva hasta 12 letras o números');
  });

  it('aplica la regla de huevos sembrados contra la nidada', () => {
    const f = puestaAFormulario(puestaPrueba());
    const { errores } = validarPuesta({ ...f, tamanioNidada: '50', huevosSembrados: '60' });
    expect(errores.huevosSembrados).toBe('Los huevos sembrados no pueden ser más que la nidada');
  });
});

describe('validarAnalisis', () => {
  it('todo vacío es válido: el análisis se llena después', () => {
    const { datos, errores } = validarAnalisis(analisisAFormulario(analisisVacio()), '2026-06-01');
    expect(errores).toEqual({});
    expect(datos).toEqual(analisisVacio());
  });

  it('rechaza una emergencia antes del muestreo', () => {
    const f = { ...analisisAFormulario(analisisVacio()), fechaEmergencia: '2026-05-20' };
    const { datos, errores } = validarAnalisis(f, '2026-06-01');
    expect(datos).toBeNull();
    expect(errores.fechaEmergencia).toBe('La emergencia no puede ser antes del muestreo');
  });

  it('valida rangos de los conteos', () => {
    const f = { ...analisisAFormulario(analisisVacio()), huevosEclosionados: '300' };
    expect(validarAnalisis(f, '2026-06-01').errores.huevosEclosionados).toBe('Debe ser de 0 a 250');
  });
});
