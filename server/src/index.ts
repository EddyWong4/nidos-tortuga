import { crearApp } from './app';
import { crearDbPg, migrar } from './db';
import { sembrarCatalogos } from './sincronizacion';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL (ej. postgres://usuario:clave@localhost:5432/nidos)');
  process.exit(1);
}

const db = crearDbPg(url);
const aplicadas = await migrar(db, { postgis: process.env.POSTGIS === '1' });
if (aplicadas.length) console.log(`Migraciones aplicadas: ${aplicadas.join(', ')}`);
await sembrarCatalogos(db);

const origenes = (process.env.CORS_ORIGIN ?? 'https://eddywong4.github.io')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const app = crearApp({ db, origenes, registrar: true });
await app.listen({ host: '0.0.0.0', port: Number(process.env.PORT ?? 3000) });

for (const senal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(senal, async () => {
    await app.close();
    await db.cerrar();
    process.exit(0);
  });
}
