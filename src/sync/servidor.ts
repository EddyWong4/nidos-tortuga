import { db as dbPorDefecto, guardarAjuste, leerAjuste, type NidosDB } from '@/db/database';
import type { Nido } from '@/domain/schemas';
import { armarPaqueteDe, marcarEntregados, pendientes } from './entrega';
import type { Paquete } from './paquete';

// Fase 6: envío automático a un servidor propio cuando hay señal.
// Apagado por defecto; la app funciona igual sin él.

export interface ConfigServidor {
  activo: boolean;
  url: string;
  token: string;
}

export const CONFIG_VACIA: ConfigServidor = { activo: false, url: '', token: '' };

export interface ResultadoPush {
  aceptados: { id: string; version: number }[];
  conflictos: { id: string; folio: string; motivo: string }[];
  rechazados: { folio: string; motivo: string }[];
}

export interface EstadoSincronizacion {
  fecha: string;
  ok: boolean;
  mensaje: string;
}

export const leerConfigServidor = (db: NidosDB = dbPorDefecto) =>
  leerAjuste<ConfigServidor>('servidor', db, CONFIG_VACIA);

export const guardarConfigServidor = (c: ConfigServidor, db: NidosDB = dbPorDefecto) =>
  guardarAjuste('servidor', { ...c, url: c.url.trim().replace(/\/+$/, '') }, db);

export const leerEstadoSincronizacion = (db: NidosDB = dbPorDefecto) =>
  leerAjuste<EstadoSincronizacion | null>('ultimaSincronizacion', db, null);

/** Adaptador HTTP: la interfaz de la app nunca llama al servidor directamente. */
export class ApiAdapter {
  constructor(private readonly config: Pick<ConfigServidor, 'url' | 'token'>) {}

  private async pedir(ruta: string, init: RequestInit = {}): Promise<Response> {
    const r = await fetch(`${this.config.url}${ruta}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.token}`,
        ...init.headers,
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (r.status === 401) throw new Error('El servidor rechazó el token de este teléfono.');
    if (!r.ok) throw new Error(`El servidor respondió ${r.status}.`);
    return r;
  }

  async salud(): Promise<boolean> {
    const r = await this.pedir('/api/salud');
    return ((await r.json()) as { ok?: boolean }).ok === true;
  }

  async push(paquete: Paquete): Promise<ResultadoPush> {
    const r = await this.pedir('/api/sync/push', { method: 'POST', body: JSON.stringify(paquete) });
    return (await r.json()) as ResultadoPush;
  }
}

let enCurso: Promise<EstadoSincronizacion | null> | null = null;

/** Envía lo pendiente. Devuelve null si no hay servidor configurado o no hay señal. */
export function sincronizar(db: NidosDB = dbPorDefecto): Promise<EstadoSincronizacion | null> {
  enCurso ??= (async () => {
    try {
      const config = await leerConfigServidor(db);
      if (!config.activo || !config.url || !navigator.onLine) return null;
      const { nidos, hastaSeq } = await pendientes(db);
      if (!nidos.length) return null;

      let estado: EstadoSincronizacion;
      try {
        const resultado = await new ApiAdapter(config).push(await armarPaqueteDe(nidos, 'sincronizacion', db));
        await marcarEntregados(resultado.aceptados, hastaSeq, 'enviado', db);
        for (const c of resultado.conflictos) await db.nidos.update(c.id, { syncStatus: 'error' } satisfies Partial<Nido>);
        const partes = [`${resultado.aceptados.length} enviados`];
        if (resultado.conflictos.length) partes.push(`${resultado.conflictos.length} con conflicto`);
        if (resultado.rechazados.length) partes.push(`${resultado.rechazados.length} rechazados`);
        estado = { fecha: new Date().toISOString(), ok: !resultado.conflictos.length, mensaje: partes.join(', ') };
      } catch (e) {
        estado = { fecha: new Date().toISOString(), ok: false, mensaje: e instanceof Error ? e.message : String(e) };
      }
      await guardarAjuste('ultimaSincronizacion', estado, db);
      return estado;
    } finally {
      enCurso = null;
    }
  })();
  return enCurso;
}
