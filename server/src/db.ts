import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

/** Lo mínimo que usa la API; así se prueba con PGlite (PostgreSQL en memoria) y se ejecuta con `pg`. */
export interface Db {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  transaccion<T>(fn: (tx: Db) => Promise<T>): Promise<T>;
}

export function crearDbPg(url: string): Db & { cerrar(): Promise<void> } {
  const pool = new pg.Pool({ connectionString: url });
  return {
    query: async (sql, params) => pool.query(sql, params as unknown[]) as never,
    async transaccion(fn) {
      const cliente = await pool.connect();
      const tx: Db = {
        query: async (sql, params) => cliente.query(sql, params as unknown[]) as never,
        transaccion: (f) => f(tx),
      };
      try {
        await cliente.query('BEGIN');
        const r = await fn(tx);
        await cliente.query('COMMIT');
        return r;
      } catch (e) {
        await cliente.query('ROLLBACK');
        throw e;
      } finally {
        cliente.release();
      }
    },
    cerrar: () => pool.end(),
  };
}

const CARPETA = fileURLToPath(new URL('../migraciones/', import.meta.url));

/** Aplica en orden los .sql numerados que falten. Con `postgis` también aplica la migración opcional. */
export async function migrar(db: Db, { postgis = false } = {}): Promise<string[]> {
  await db.query('CREATE TABLE IF NOT EXISTS migraciones (nombre text PRIMARY KEY, aplicada timestamptz NOT NULL DEFAULT now())');
  const hechas = new Set((await db.query<{ nombre: string }>('SELECT nombre FROM migraciones')).rows.map((r) => r.nombre));
  const archivos = (await readdir(CARPETA)).filter((f) => /^\d+_.+\.sql$/.test(f) || (postgis && f === 'opcional_postgis.sql')).sort();
  const aplicadas: string[] = [];
  for (const nombre of archivos) {
    if (hechas.has(nombre)) continue;
    const sql = await readFile(`${CARPETA}${nombre}`, 'utf8');
    await db.transaccion(async (tx) => {
      for (const sentencia of sql.split(/;\s*$/m).map((s) => s.trim()).filter((s) => s && !/^(--[^\n]*\n?)*$/.test(s))) {
        await tx.query(sentencia);
      }
      await tx.query('INSERT INTO migraciones (nombre) VALUES ($1)', [nombre]);
    });
    aplicadas.push(nombre);
  }
  return aplicadas;
}
