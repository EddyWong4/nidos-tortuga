import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NidosDB } from '@/db/database';
import { actualizarNido, contarNidos, crearNido, guardarPerfil } from '@/db/repositorio';
import { perfilPrueba, puestaPrueba } from '@/test/fixtures';
import { confirmarEntrega, pendientes, prepararEntrega } from './entrega';
import { importarPaquete, resolverConflicto } from './importacion';
import { leerPaquete, PaqueteInvalidoError } from './paquete';
import { aCSV, COLUMNAS } from './reportes';
import { asegurarRespaldoDiario, crearRespaldo, RESPALDOS_A_CONSERVAR } from './respaldos';

let n = 0;
let observador: NidosDB;
let coordinador: NidosDB;

beforeEach(async () => {
  observador = new NidosDB(`obs-${n}`);
  coordinador = new NidosDB(`coord-${n++}`);
  await guardarPerfil(perfilPrueba({ codigoDispositivo: 'B07' }), observador);
  await guardarPerfil(perfilPrueba({ codigoDispositivo: 'A01', rol: 'coordinador' }), coordinador);
});

afterEach(async () => {
  await observador.delete();
  await coordinador.delete();
});

/** Simula compartir el archivo por WhatsApp e importarlo en el teléfono del coordinador. */
async function entregarAlCoordinador() {
  const entrega = await prepararEntrega(observador);
  if (!entrega) throw new Error('nada que entregar');
  await confirmarEntrega(entrega, observador);
  const leido = await leerPaquete(entrega.contenido);
  return importarPaquete(leido, entrega.nombreArchivo, coordinador);
}

describe('entrega', () => {
  it('sin cambios no hay nada que entregar', async () => {
    expect(await prepararEntrega(observador)).toBeNull();
  });

  it('entrega solo lo pendiente, lo marca como entregado y guarda el lote', async () => {
    await crearNido(puestaPrueba(), observador);
    await crearNido(puestaPrueba(), observador);
    const entrega = (await prepararEntrega(observador))!;
    expect(entrega.nombreArchivo).toMatch(/^entrega-B07-\d{4}-\d{2}-\d{2}-\d{4}\.txt$/);
    expect(entrega.paquete.nidos).toHaveLength(2);

    await confirmarEntrega(entrega, observador);
    expect((await pendientes(observador)).nidos).toHaveLength(0);
    expect((await contarNidos(observador)).porEntregar).toBe(0);
    expect((await observador.nidos.toArray()).every((x) => x.syncStatus === 'entregado')).toBe(true);
    expect(await observador.lotes.where('origen').equals('exportacion').count()).toBe(1);
  });

  it('un nido editado mientras se compartía sigue pendiente', async () => {
    const nido = await crearNido(puestaPrueba(), observador);
    const entrega = (await prepararEntrega(observador))!;
    await actualizarNido(nido.id, { baliza: 20 }, observador);
    await confirmarEntrega(entrega, observador);
    expect((await pendientes(observador)).nidos.map((x) => x.version)).toEqual([2]);
  });
});

describe('leerPaquete', () => {
  it('rechaza archivos que no son entregas', async () => {
    await expect(leerPaquete('hola')).rejects.toBeInstanceOf(PaqueteInvalidoError);
    await expect(leerPaquete('{"a":1}')).rejects.toBeInstanceOf(PaqueteInvalidoError);
  });

  it('detecta un archivo modificado a mano', async () => {
    await crearNido(puestaPrueba(), observador);
    const entrega = (await prepararEntrega(observador))!;
    const alterado = entrega.contenido.replace('"baliza": 12', '"baliza": 13');
    expect(alterado).not.toBe(entrega.contenido);
    await expect(leerPaquete(alterado)).rejects.toThrow(/dañado o fue modificado/);
  });
});

describe('modo coordinador', () => {
  it('importa nidos nuevos y reimportar el mismo archivo no duplica', async () => {
    await crearNido(puestaPrueba(), observador);
    const entrega = (await prepararEntrega(observador))!;
    const leido = await leerPaquete(entrega.contenido);

    const r1 = await importarPaquete(leido, 'a.txt', coordinador);
    expect(r1).toMatchObject({ nuevos: 1, conflictos: 0 });
    const r2 = await importarPaquete(leido, 'a.txt', coordinador);
    expect(r2).toMatchObject({ nuevos: 0, sinCambios: 1 });
    expect(await coordinador.nidos.count()).toBe(1);
  });

  it('una versión más nueva reemplaza y la anterior queda en el historial', async () => {
    const nido = await crearNido(puestaPrueba(), observador);
    await entregarAlCoordinador();
    await actualizarNido(nido.id, { analisis: { fechaEmergencia: '2026-07-20', huevosEclosionados: 90 } }, observador);
    const r = await entregarAlCoordinador();

    expect(r.actualizados).toBe(1);
    expect((await coordinador.nidos.get(nido.id))?.analisis.huevosEclosionados).toBe(90);
    const historial = await coordinador.historial.where('nidoId').equals(nido.id).toArray();
    expect(historial.map((h) => h.version)).toEqual([1]);
  });

  it('un archivo viejo no pisa datos más nuevos', async () => {
    const nido = await crearNido(puestaPrueba(), observador);
    const viejo = (await prepararEntrega(observador))!;
    await confirmarEntrega(viejo, observador);
    await actualizarNido(nido.id, { baliza: 20 }, observador);
    await entregarAlCoordinador();

    const r = await importarPaquete(await leerPaquete(viejo.contenido), viejo.nombreArchivo, coordinador);
    expect(r.antiguos).toBe(1);
    expect((await coordinador.nidos.get(nido.id))?.baliza).toBe(20);
  });

  it('folio repetido en otro teléfono: conflicto que el coordinador resuelve', async () => {
    const otro = new NidosDB(`otro-${n}`);
    await guardarPerfil(perfilPrueba({ codigoDispositivo: 'B07', observador: 'Otra persona' }), otro);
    await crearNido(puestaPrueba({ especie: 'Verde' }), observador);
    await crearNido(puestaPrueba({ especie: 'Carey' }), otro);

    await entregarAlCoordinador();
    const entregaOtro = (await prepararEntrega(otro))!;
    const r = await importarPaquete(await leerPaquete(entregaOtro.contenido), entregaOtro.nombreArchivo, coordinador);
    expect(r.conflictos).toBe(1);

    const [conflicto] = await coordinador.conflictos.toArray();
    expect(conflicto).toMatchObject({ motivo: 'folio-duplicado', folio: 'B07-0001', resuelto: 0 });
    expect((await coordinador.nidos.toArray()).map((x) => x.especie)).toEqual(['Verde']);

    await resolverConflicto(conflicto.id!, 'usarEntrante', coordinador);
    expect((await coordinador.nidos.toArray()).map((x) => x.especie)).toEqual(['Carey']);
    expect(await coordinador.historial.count()).toBe(1);
    expect((await coordinador.conflictos.get(conflicto.id!))?.resuelto).toBe(1);
    await otro.delete();
  });

  it('conservar los dos: el entrante recibe una letra y sus actualizaciones posteriores la respetan', async () => {
    const otro = new NidosDB(`otro2-${n}`);
    await guardarPerfil(perfilPrueba({ codigoDispositivo: 'B07', observador: 'Otra persona' }), otro);
    await crearNido(puestaPrueba({ especie: 'Verde' }), observador);
    const suyo = await crearNido(puestaPrueba({ especie: 'Carey' }), otro);
    await entregarAlCoordinador();

    const entrega1 = (await prepararEntrega(otro))!;
    await confirmarEntrega(entrega1, otro);
    await importarPaquete(await leerPaquete(entrega1.contenido), entrega1.nombreArchivo, coordinador);
    const [conflicto] = await coordinador.conflictos.toArray();
    expect(await resolverConflicto(conflicto.id!, 'conservarAmbos', coordinador)).toBe('B07-0001B');
    expect((await coordinador.nidos.orderBy('folio').toArray()).map((x) => [x.folio, x.especie])).toEqual([
      ['B07-0001', 'Verde'],
      ['B07-0001B', 'Carey'],
    ]);

    // El otro teléfono sigue llamándolo B07-0001 y manda su análisis: se actualiza sin crear otro conflicto.
    await actualizarNido(suyo.id, { analisis: { fechaEmergencia: '2026-07-20', huevosEclosionados: 50 } }, otro);
    const entrega2 = (await prepararEntrega(otro))!;
    const r = await importarPaquete(await leerPaquete(entrega2.contenido), entrega2.nombreArchivo, coordinador);
    expect(r).toMatchObject({ actualizados: 1, conflictos: 0 });
    const actualizado = await coordinador.nidos.get(suyo.id);
    expect([actualizado?.folio, actualizado?.analisis.huevosEclosionados]).toEqual(['B07-0001B', 50]);

    // Reimportar la primera entrega (misma versión 1 que ya fue superada) no genera conflicto.
    const r2 = await importarPaquete(await leerPaquete(entrega1.contenido), entrega1.nombreArchivo, coordinador);
    expect(r2).toMatchObject({ antiguos: 1, conflictos: 0 });
    await otro.delete();
  });

  it('rechaza solo los nidos dañados y conserva el resto', async () => {
    await crearNido(puestaPrueba(), observador);
    await crearNido(puestaPrueba(), observador);
    const entrega = (await prepararEntrega(observador))!;
    const leido = await leerPaquete(entrega.contenido);
    leido.rechazados.push({ folio: 'B07-9999', motivo: 'prueba' });
    const r = await importarPaquete(leido, 'x.txt', coordinador);
    expect(r.nuevos).toBe(2);
    expect(r.rechazados).toEqual([{ folio: 'B07-9999', motivo: 'prueba' }]);
  });
});

describe('respaldos', () => {
  it('uno por día y solo los últimos 7', async () => {
    expect(await asegurarRespaldoDiario(observador)).toBe(false); // sin nidos no respalda
    await crearNido(puestaPrueba(), observador);
    expect(await asegurarRespaldoDiario(observador)).toBe(true);
    expect(await asegurarRespaldoDiario(observador)).toBe(false);
    for (let i = 0; i < 10; i++) await crearRespaldo(observador);
    expect(await observador.respaldos.count()).toBe(RESPALDOS_A_CONSERVAR);
  });

  it('restaurar un respaldo recupera nidos perdidos', async () => {
    await crearNido(puestaPrueba(), observador);
    await crearRespaldo(observador);
    const respaldo = (await observador.respaldos.toArray())[0];
    await observador.nidos.clear();
    const r = await importarPaquete(await leerPaquete(respaldo.contenido), 'respaldo', observador);
    expect(r.nuevos).toBe(1);
    expect(await observador.nidos.count()).toBe(1);
  });
});

describe('reportes', () => {
  it('CSV con encabezados en español, campos calculados y sin eliminados', async () => {
    const a = await crearNido(puestaPrueba({ especie: 'Laúd' }), observador);
    await actualizarNido(
      a.id,
      { analisis: { fechaEmergencia: '2026-07-20', huevosEclosionados: 88, huevosSinDesarrollo: 8, huevosConDesarrolloAparente: 4 } },
      observador,
    );
    await crearNido(puestaPrueba({ hembra: { largoCurvoCm: null, anchoCurvoCm: null, placa: null, observaciones: 'Herida, "vieja"' } }), observador);

    const csv = aCSV(await observador.nidos.toArray());
    const lineas = csv.replace('﻿', '').trim().split('\r\n');
    expect(csv.startsWith('﻿')).toBe(true);
    expect(lineas).toHaveLength(3);
    expect(lineas[0].split(',')).toHaveLength(COLUMNAS.length);
    expect(lineas[0]).toContain('Éxito de eclosión (%)');

    const col = (t: string) => COLUMNAS.findIndex((c) => c.titulo === t);
    const fila1 = lineas[1].split(',');
    expect(fila1[col('Folio')]).toBe('B07-0001');
    expect(fila1[col('Especie')]).toBe('Laúd');
    expect(fila1[col('Total de huevos por nido')]).toBe('100');
    expect(fila1[col('Éxito de eclosión (%)')]).toBe('88');
    expect(fila1[col('Fecha de probable emergencia')]).toBe('2026-07-16');
    expect(lineas[2]).toContain('"Herida, ""vieja"""');
  });
});
