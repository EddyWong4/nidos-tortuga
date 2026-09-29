import { PGlite } from '@electric-sql/pglite';
import { crearApp, huella } from './app';
import { migrar, type Db } from './db';
import { sembrarCatalogos } from './sincronizacion';

// Servidor de DEMOSTRACIÓN: PostgreSQL en memoria (PGlite), sin instalar nada.
// Los datos se pierden al cerrarlo. Para producción usa `npm start` con DATABASE_URL.

const pg = new PGlite();
const db: Db = {
  query: (sql, params) => pg.query(sql, params) as never,
  transaccion: (fn) =>
    pg.transaction((tx) => {
      const txDb: Db = { query: (sql, params) => tx.query(sql, params) as never, transaccion: (f) => f(txDb) };
      return fn(txDb);
    }) as never,
};

await migrar(db);
await sembrarCatalogos(db);

const TOKEN_DEMO = 'demo-B07';
await db.query('INSERT INTO dispositivos (codigo, observador, token_sha256) VALUES ($1, $2, $3)', [
  'B07',
  'Demostración',
  huella(TOKEN_DEMO),
]);

const origenes = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5180,http://localhost:4173')
  .split(',')
  .map((o) => o.trim());
const puerto = Number(process.env.PORT ?? 3000);

const app = crearApp({ db, origenes });
app.get('/api/demo/nidos', async () => (await db.query('SELECT folio, version, especie, recibido_de FROM nidos ORDER BY folio')).rows);
await app.listen({ host: '127.0.0.1', port: puerto });

console.log(`Servidor de demostración en http://localhost:${puerto}`);
console.log(`Teléfono B07 · token: ${TOKEN_DEMO}`);
console.log(`Nidos recibidos: http://localhost:${puerto}/api/demo/nidos`);
