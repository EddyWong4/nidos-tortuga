import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NidosDB } from './database';
import {
  actualizarNido,
  contarNidos,
  crearNido,
  eliminarNido,
  guardarPerfil,
  obtenerPerfil,
  PerfilFaltanteError,
  valoresCatalogo,
} from './repositorio';
import { perfilPrueba, puestaPrueba } from '@/test/fixtures';

let db: NidosDB;
let n = 0;

beforeEach(async () => {
  db = new NidosDB(`prueba-${n++}`);
  await guardarPerfil(perfilPrueba(), db);
});

afterEach(async () => {
  await db.delete();
});

describe('crearNido', () => {
  it('asigna UUID, folio con código de dispositivo y versión 1', async () => {
    const nido = await crearNido(puestaPrueba(), db);
    expect(nido.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(nido.folio).toBe('B07-0001');
    expect(nido.version).toBe(1);
    expect(nido.syncStatus).toBe('pendiente');
    expect(nido.temporada).toBe(2026);
  });

  it('avanza el consecutivo del dispositivo', async () => {
    await crearNido(puestaPrueba(), db);
    const segundo = await crearNido(puestaPrueba(), db);
    expect(segundo.folio).toBe('B07-0002');
    expect((await obtenerPerfil(db))?.siguienteConsecutivo).toBe(3);
  });

  it('anota el cambio en la outbox', async () => {
    const nido = await crearNido(puestaPrueba(), db);
    expect(await db.outbox.where({ nidoId: nido.id }).count()).toBe(1);
  });

  it('no guarda nada si los datos son inválidos', async () => {
    await expect(crearNido(puestaPrueba({ huevosSembrados: 200, tamanioNidada: 100 }), db)).rejects.toThrow();
    expect(await db.nidos.count()).toBe(0);
    expect(await db.outbox.count()).toBe(0);
    expect((await obtenerPerfil(db))?.siguienteConsecutivo).toBe(1);
  });

  it('exige un perfil configurado', async () => {
    await db.perfil.clear();
    await expect(crearNido(puestaPrueba(), db)).rejects.toBeInstanceOf(PerfilFaltanteError);
  });
});

describe('actualizarNido', () => {
  it('sube la versión, conserva lo no modificado y anota otro cambio', async () => {
    const nido = await crearNido(puestaPrueba(), db);
    const editado = await actualizarNido(nido.id, { analisis: { huevosEclosionados: 90 } }, db);
    expect(editado.version).toBe(2);
    expect(editado.analisis.huevosEclosionados).toBe(90);
    expect(editado.especie).toBe('Verde');
    expect(editado.createdAt).toBe(nido.createdAt);
    expect(await db.outbox.count()).toBe(2);
  });

  it('rechaza una emergencia anterior al muestreo', async () => {
    const nido = await crearNido(puestaPrueba(), db);
    await expect(actualizarNido(nido.id, { analisis: { fechaEmergencia: '2026-05-01' } }, db)).rejects.toThrow();
  });
});

describe('eliminarNido', () => {
  it('marca como borrado sin perder el registro', async () => {
    const nido = await crearNido(puestaPrueba(), db);
    await eliminarNido(nido.id, db);
    const guardado = await db.nidos.get(nido.id);
    expect(guardado?.deleted).toBe(true);
    expect(guardado?.version).toBe(2);
    expect((await contarNidos(db)).total).toBe(0);
  });
});

describe('contarNidos', () => {
  it('cuenta total, sin análisis y por entregar', async () => {
    const a = await crearNido(puestaPrueba(), db);
    await crearNido(puestaPrueba(), db);
    await actualizarNido(a.id, { analisis: { fechaEmergencia: '2026-07-20' } }, db);
    expect(await contarNidos(db)).toEqual({ total: 2, sinAnalisis: 1, porEntregar: 2 });
  });
});

describe('catálogos', () => {
  it('se siembran al crear la base', async () => {
    expect(await valoresCatalogo('especie', db)).toEqual(['Laúd', 'Verde', 'Caguama', 'Carey', 'Lora']);
    expect(await valoresCatalogo('municipio', db)).toEqual(['Nautla', 'Vega de Alatorre']);
  });
});
