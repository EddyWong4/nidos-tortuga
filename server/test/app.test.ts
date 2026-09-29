import { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { analisisVacio, type Nido } from '../../src/domain/schemas';
import { armarPaquete, type Paquete } from '../../src/sync/paquete';
import { crearApp, huella } from '../src/app';
import { migrar, type Db } from '../src/db';
import { sembrarCatalogos } from '../src/sincronizacion';

let pg: PGlite;
let db: Db;
let app: ReturnType<typeof crearApp>;

const TOKEN_B07 = 'token-de-prueba-b07';
const TOKEN_B12 = 'token-de-prueba-b12';

function adaptar(p: PGlite): Db {
  return {
    query: (sql, params) => p.query(sql, params) as never,
    transaccion: (fn) =>
      p.transaction((tx) => {
        const txDb: Db = { query: (sql, params) => tx.query(sql, params) as never, transaccion: (f) => f(txDb) };
        return fn(txDb);
      }) as never,
  };
}

let contador = 0;
function nido(deviceId: string, cambios: Partial<Nido> = {}): Nido {
  contador++;
  return {
    id: crypto.randomUUID(),
    folio: `${deviceId}-${String(contador).padStart(4, '0')}`,
    temporada: 2026,
    campamentoId: 'campamento-principal',
    deviceId,
    observador: 'Prueba',
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z',
    version: 1,
    syncStatus: 'pendiente',
    deleted: false,
    fechaMuestreo: '2026-06-01',
    especie: 'Verde',
    municipio: 'Nautla',
    baliza: 12,
    lat: 20.2167,
    lng: -96.7765,
    precisionGps: 5,
    ubicacionManual: false,
    zonaAnidacion: 'B',
    horaPuesta: '23:40',
    tamanioNidada: 110,
    huevosSembrados: 108,
    tipoIncubacion: 'In situ',
    hembra: { largoCurvoCm: null, anchoCurvoCm: null, placa: null, observaciones: null },
    analisis: analisisVacio(),
    ...cambios,
  };
}

const paquete = (deviceId: string, nidos: Nido[]): Promise<Paquete> =>
  armarPaquete({ tipo: 'sincronizacion', deviceId, observador: 'Prueba', campamentoId: 'campamento-principal', nidos, catalogos: [] });

const push = (p: Paquete, token = TOKEN_B07) =>
  app.inject({ method: 'POST', url: '/api/sync/push', payload: p, headers: { authorization: `Bearer ${token}` } });

beforeEach(async () => {
  pg = new PGlite();
  db = adaptar(pg);
  await migrar(db);
  await sembrarCatalogos(db);
  for (const [codigo, token] of [['B07', TOKEN_B07], ['B12', TOKEN_B12]]) {
    await db.query('INSERT INTO dispositivos (codigo, observador, token_sha256) VALUES ($1, $2, $3)', [codigo, 'Prueba', huella(token)]);
  }
  app = crearApp({ db, origenes: ['https://eddywong4.github.io'] });
});

afterEach(async () => {
  await app.close();
  await pg.close();
});

describe('API de sincronización', () => {
  it('responde la salud sin token', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/salud' });
    expect(r.json()).toEqual({ ok: true, servicio: 'nidos-tortuga' });
  });

  it('exige un token válido', async () => {
    const p = await paquete('B07', [nido('B07')]);
    expect((await app.inject({ method: 'POST', url: '/api/sync/push', payload: p })).statusCode).toBe(401);
    expect((await push(p, 'otro-token')).statusCode).toBe(401);
  });

  it('un teléfono no puede enviar a nombre de otro', async () => {
    const r = await push(await paquete('B12', [nido('B12')]), TOKEN_B07);
    expect(r.statusCode).toBe(403);
  });

  it('rechaza paquetes dañados', async () => {
    const p = await paquete('B07', [nido('B07')]);
    const r = await push({ ...p, sha256: '0'.repeat(64) });
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toMatch(/dañado/);
  });

  it('guarda nidos nuevos y reenviar no duplica', async () => {
    const nidos = [nido('B07'), nido('B07')];
    const p = await paquete('B07', nidos);
    const r1 = (await push(p)).json();
    expect(r1.aceptados).toHaveLength(2);
    const r2 = (await push(p)).json();
    expect(r2.aceptados).toHaveLength(2);
    const { rows } = await db.query<{ total: number }>('SELECT count(*)::int AS total FROM nidos');
    expect(rows[0].total).toBe(2);
    const guardado = (await db.query<{ datos: Nido }>('SELECT datos FROM nidos WHERE id = $1', [nidos[0].id])).rows[0].datos;
    expect(guardado.syncStatus).toBe('enviado');
  });

  it('una versión nueva reemplaza y guarda la anterior en el historial', async () => {
    const n = nido('B07');
    await push(await paquete('B07', [n]));
    const v2 = { ...n, version: 2, analisis: { ...n.analisis, fechaEmergencia: '2026-07-20', huevosEclosionados: 90 } };
    expect((await push(await paquete('B07', [v2]))).json().aceptados).toEqual([{ id: n.id, version: 2 }]);

    const { rows } = await db.query<{ version: number; eclosionados: string }>(
      "SELECT version, datos->'analisis'->>'huevosEclosionados' AS eclosionados FROM nidos WHERE id = $1",
      [n.id],
    );
    expect(rows[0]).toEqual({ version: 2, eclosionados: '90' });
    const hist = await db.query<{ version: number }>('SELECT version FROM nidos_historial WHERE nido_id = $1', [n.id]);
    expect(hist.rows).toEqual([{ version: 1 }]);
  });

  it('folio repetido desde otro teléfono queda como conflicto, sin pisar el existente', async () => {
    const original = nido('B07', { folio: 'B07-9001', especie: 'Verde' });
    await push(await paquete('B07', [original]));
    const intruso = nido('B12', { folio: 'B07-9001', especie: 'Carey' });
    const r = (await push(await paquete('B12', [intruso]), TOKEN_B12)).json();
    expect(r.conflictos).toEqual([{ id: intruso.id, folio: 'B07-9001', motivo: 'folio-duplicado' }]);
    expect(r.aceptados).toEqual([]);

    const { rows } = await db.query<{ especie: string }>("SELECT especie FROM nidos WHERE folio = 'B07-9001'");
    expect(rows).toEqual([{ especie: 'Verde' }]);
    // Reenviar no repite el conflicto
    await push(await paquete('B12', [intruso]), TOKEN_B12);
    const c = await db.query<{ total: number }>('SELECT count(*)::int AS total FROM conflictos');
    expect(c.rows[0].total).toBe(1);
  });

  it('entrega los catálogos iniciales', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/sync/catalogos', headers: { authorization: `Bearer ${TOKEN_B07}` } });
    const especies = (r.json() as { tipo: string; valor: string }[]).filter((c) => c.tipo === 'especie').map((c) => c.valor);
    expect(especies).toEqual(['Laúd', 'Verde', 'Caguama', 'Carey', 'Lora']);
  });

  it('permite peticiones desde la app publicada (CORS)', async () => {
    const r = await app.inject({
      method: 'OPTIONS',
      url: '/api/sync/push',
      headers: { origin: 'https://eddywong4.github.io', 'access-control-request-method': 'POST' },
    });
    expect(r.headers['access-control-allow-origin']).toBe('https://eddywong4.github.io');
  });
});
