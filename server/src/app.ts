import { createHash, timingSafeEqual } from 'node:crypto';
import cors from '@fastify/cors';
import Fastify, { type FastifyRequest } from 'fastify';
import { leerPaquete, PaqueteInvalidoError } from '../../src/sync/paquete';
import type { Db } from './db';
import { recibirPaquete } from './sincronizacion';

export const huella = (token: string) => createHash('sha256').update(token).digest('hex');

declare module 'fastify' {
  interface FastifyRequest {
    dispositivo?: string;
  }
}

export interface OpcionesApp {
  db: Db;
  /** Orígenes que pueden llamar a la API desde el navegador (la app publicada). */
  origenes: string[];
  registrar?: boolean;
}

export function crearApp({ db, origenes, registrar = false }: OpcionesApp) {
  const app = Fastify({ logger: registrar, bodyLimit: 20 * 1024 * 1024 });

  void app.register(cors, { origin: origenes, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization'] });

  app.get('/api/salud', async () => ({ ok: true, servicio: 'nidos-tortuga' }));

  // Cada teléfono tiene su token; se guarda solo su huella SHA-256.
  async function autenticar(req: FastifyRequest): Promise<string | null> {
    const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1];
    if (!token) return null;
    const h = huella(token);
    const { rows } = await db.query<{ codigo: string; token_sha256: string }>(
      'SELECT codigo, token_sha256 FROM dispositivos WHERE token_sha256 = $1 AND activo',
      [h],
    );
    const fila = rows[0];
    if (!fila || !timingSafeEqual(Buffer.from(fila.token_sha256), Buffer.from(h))) return null;
    return fila.codigo;
  }

  app.addHook('onRequest', async (req, reply) => {
    if (!req.url.startsWith('/api/sync/')) return;
    const dispositivo = await autenticar(req);
    if (!dispositivo) return reply.code(401).send({ error: 'Token inválido o dispositivo desactivado' });
    req.dispositivo = dispositivo;
  });

  app.post('/api/sync/push', async (req, reply) => {
    try {
      const leido = await leerPaquete(req.body);
      // Un teléfono solo puede enviar a nombre de su propio código.
      if (leido.paquete.deviceId !== req.dispositivo) {
        return reply.code(403).send({ error: `Este token es del teléfono ${req.dispositivo}, no de ${leido.paquete.deviceId}` });
      }
      return await recibirPaquete(db, leido, req.dispositivo!);
    } catch (e) {
      if (e instanceof PaqueteInvalidoError) return reply.code(400).send({ error: e.message });
      throw e;
    }
  });

  app.get('/api/sync/catalogos', async () => {
    const { rows } = await db.query('SELECT id, tipo, valor, orden, activo FROM catalogos ORDER BY tipo, orden');
    return rows;
  });

  return app;
}
