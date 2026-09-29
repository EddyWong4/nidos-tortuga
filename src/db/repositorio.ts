import { db as dbPorDefecto, type NidosDB } from './database';
import { formatearFolio } from '@/domain/folio';
import {
  analisisVacio,
  nidoSchema,
  perfilSchema,
  type EtapaAnalisis,
  type EtapaPuesta,
  type Nido,
  type Perfil,
} from '@/domain/schemas';
import type { TipoCatalogo } from '@/domain/catalogos';

// Toda escritura pasa por aquí: valida, sube la versión y anota el cambio en la outbox
// dentro de la misma transacción, para que ningún cambio quede sin entregar.

const ahora = () => new Date().toISOString();

export class PerfilFaltanteError extends Error {
  constructor() {
    super('Configura el perfil del dispositivo antes de capturar nidos');
  }
}

export async function obtenerPerfil(db: NidosDB = dbPorDefecto): Promise<Perfil | undefined> {
  const guardado = await db.perfil.get('actual');
  if (!guardado) return undefined;
  const { id: _id, ...perfil } = guardado;
  return perfil;
}

export async function guardarPerfil(perfil: Perfil, db: NidosDB = dbPorDefecto): Promise<void> {
  await db.perfil.put({ id: 'actual', ...perfilSchema.parse(perfil) });
}

export async function crearNido(puesta: EtapaPuesta, db: NidosDB = dbPorDefecto): Promise<Nido> {
  return db.transaction('rw', db.nidos, db.outbox, db.perfil, async () => {
    const perfil = await obtenerPerfil(db);
    if (!perfil) throw new PerfilFaltanteError();

    const momento = ahora();
    const nido = nidoSchema.parse({
      ...puesta,
      id: crypto.randomUUID(),
      folio: formatearFolio(perfil.codigoDispositivo, perfil.siguienteConsecutivo),
      temporada: Number(puesta.fechaMuestreo.slice(0, 4)),
      campamentoId: perfil.campamentoId,
      deviceId: perfil.codigoDispositivo,
      observador: perfil.observador,
      createdAt: momento,
      updatedAt: momento,
      version: 1,
      syncStatus: 'pendiente',
      deleted: false,
      analisis: analisisVacio(),
    });

    await db.nidos.add(nido);
    await db.outbox.add({ nidoId: nido.id, version: nido.version, createdAt: momento });
    await db.perfil.update('actual', { siguienteConsecutivo: perfil.siguienteConsecutivo + 1 });
    return nido;
  });
}

type CambiosNido = Partial<EtapaPuesta> & { analisis?: Partial<EtapaAnalisis> };

export async function actualizarNido(id: string, cambios: CambiosNido, db: NidosDB = dbPorDefecto): Promise<Nido> {
  return db.transaction('rw', db.nidos, db.outbox, async () => {
    const actual = await db.nidos.get(id);
    if (!actual) throw new Error(`No existe el nido ${id}`);

    const momento = ahora();
    const nido = nidoSchema.parse({
      ...actual,
      ...cambios,
      analisis: { ...actual.analisis, ...cambios.analisis },
      version: actual.version + 1,
      updatedAt: momento,
      syncStatus: 'pendiente',
    });

    await db.nidos.put(nido);
    await db.outbox.add({ nidoId: nido.id, version: nido.version, createdAt: momento });
    return nido;
  });
}

/** Borrado lógico: el registro se conserva y el borrado viaja como un cambio más. */
export async function eliminarNido(id: string, db: NidosDB = dbPorDefecto): Promise<void> {
  await db.transaction('rw', db.nidos, db.outbox, async () => {
    const actual = await db.nidos.get(id);
    if (!actual) return;
    const momento = ahora();
    const version = actual.version + 1;
    await db.nidos.update(id, { deleted: true, version, updatedAt: momento, syncStatus: 'pendiente' });
    await db.outbox.add({ nidoId: id, version, createdAt: momento });
  });
}

export interface Conteos {
  total: number;
  sinAnalisis: number;
  porEntregar: number;
}

export async function contarNidos(db: NidosDB = dbPorDefecto): Promise<Conteos> {
  const activos = await db.nidos.filter((n) => !n.deleted).toArray();
  const porEntregar = new Set((await db.outbox.toArray()).map((c) => c.nidoId)).size;
  return {
    total: activos.length,
    sinAnalisis: activos.filter((n) => n.analisis.fechaEmergencia == null).length,
    porEntregar,
  };
}

export async function valoresCatalogo(tipo: TipoCatalogo, db: NidosDB = dbPorDefecto): Promise<string[]> {
  const items = await db.catalogos.where({ tipo, activo: 1 }).toArray();
  return items.sort((a, b) => a.orden - b.orden).map((i) => i.valor);
}
