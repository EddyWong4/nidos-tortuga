import { z } from 'zod';
import { TIPOS_CATALOGO } from '../domain/catalogos';
import { nidoSchema, type Nido } from '../domain/schemas';

// Formato de todo lo que sale del teléfono: archivo de entrega, respaldo o envío al servidor.
// Solo rutas relativas: el servidor también lo usa.

export const FORMATO = 'nidos-tortuga';
export const VERSION_ESQUEMA = 1;

const catalogoItemSchema = z.object({
  id: z.string(),
  tipo: z.enum(TIPOS_CATALOGO),
  valor: z.string(),
  orden: z.number(),
  activo: z.union([z.literal(0), z.literal(1)]),
});

export const paqueteSchema = z.object({
  formato: z.literal(FORMATO),
  versionEsquema: z.number().int(),
  tipo: z.enum(['entrega', 'respaldo', 'consolidado', 'sincronizacion']),
  generadoEn: z.string().datetime(),
  deviceId: z.string(),
  observador: z.string(),
  campamentoId: z.string(),
  /** Se validan uno por uno al importar, para no rechazar todo el archivo por un nido dañado. */
  nidos: z.array(z.unknown()),
  catalogos: z.array(catalogoItemSchema).default([]),
  /** SHA-256 de `nidos`: detecta archivos cortados o editados a mano. */
  sha256: z.string().length(64),
});

export type Paquete = z.infer<typeof paqueteSchema>;

export async function sha256(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function armarPaquete(datos: Omit<Paquete, 'formato' | 'versionEsquema' | 'sha256' | 'generadoEn'>): Promise<Paquete> {
  return {
    formato: FORMATO,
    versionEsquema: VERSION_ESQUEMA,
    generadoEn: new Date().toISOString(),
    ...datos,
    sha256: await sha256(JSON.stringify(datos.nidos)),
  };
}

export class PaqueteInvalidoError extends Error {}

export interface PaqueteLeido {
  paquete: Paquete;
  nidos: Nido[];
  rechazados: { folio: string; motivo: string }[];
}

/** Lee y verifica un paquete. Lanza PaqueteInvalidoError si el archivo entero no sirve. */
export async function leerPaquete(texto: string | unknown): Promise<PaqueteLeido> {
  let crudo: unknown = texto;
  if (typeof texto === 'string') {
    try {
      crudo = JSON.parse(texto);
    } catch {
      throw new PaqueteInvalidoError('El archivo no es una entrega de Nidos de Tortuga (no se pudo leer).');
    }
  }
  const r = paqueteSchema.safeParse(crudo);
  if (!r.success) {
    throw new PaqueteInvalidoError('El archivo no es una entrega de Nidos de Tortuga o está incompleto.');
  }
  const paquete = r.data;
  if (paquete.versionEsquema > VERSION_ESQUEMA) {
    throw new PaqueteInvalidoError('El archivo viene de una versión más nueva de la app. Actualiza la app primero.');
  }
  if ((await sha256(JSON.stringify(paquete.nidos))) !== paquete.sha256) {
    throw new PaqueteInvalidoError('El archivo está dañado o fue modificado (la suma de verificación no coincide).');
  }

  const nidos: Nido[] = [];
  const rechazados: PaqueteLeido['rechazados'] = [];
  for (const crudoNido of paquete.nidos) {
    const n = nidoSchema.safeParse(crudoNido);
    if (n.success) nidos.push(n.data);
    else {
      const folio = (crudoNido as { folio?: string })?.folio ?? '(sin folio)';
      rechazados.push({ folio, motivo: n.error.issues[0]?.message ?? 'Datos inválidos' });
    }
  }
  return { paquete, nidos, rechazados };
}
