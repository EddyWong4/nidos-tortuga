import { format } from 'date-fns';
import { db as dbPorDefecto, type NidosDB } from '@/db/database';
import { obtenerPerfil } from '@/db/repositorio';
import type { Nido } from '@/domain/schemas';
import { armarPaquete, type Paquete } from './paquete';

/** Lo que falta por entregar: la última versión de cada nido con cambios en la outbox. */
export async function pendientes(db: NidosDB = dbPorDefecto): Promise<{ nidos: Nido[]; hastaSeq: number }> {
  const cambios = await db.outbox.toArray();
  const ids = [...new Set(cambios.map((c) => c.nidoId))];
  const nidos = (await db.nidos.bulkGet(ids)).filter((n): n is Nido => n != null);
  const hastaSeq = Math.max(0, ...cambios.map((c) => c.seq ?? 0));
  return { nidos, hastaSeq };
}

export async function armarPaqueteDe(
  nidos: Nido[],
  tipo: Paquete['tipo'],
  db: NidosDB = dbPorDefecto,
): Promise<Paquete> {
  const perfil = await obtenerPerfil(db);
  return armarPaquete({
    tipo,
    deviceId: perfil?.codigoDispositivo ?? 'sin-perfil',
    observador: perfil?.observador ?? '',
    campamentoId: perfil?.campamentoId ?? '',
    nidos,
    catalogos: await db.catalogos.toArray(),
  });
}

export interface Entrega {
  paquete: Paquete;
  nombreArchivo: string;
  contenido: string;
  hastaSeq: number;
}

/** Arma el archivo de entrega con lo pendiente. No marca nada: eso pasa solo si el archivo sí se compartió. */
export async function prepararEntrega(db: NidosDB = dbPorDefecto): Promise<Entrega | null> {
  const { nidos, hastaSeq } = await pendientes(db);
  if (!nidos.length) return null;
  const paquete = await armarPaqueteDe(nidos, 'entrega', db);
  // .txt y no .json: Chrome en Android no permite compartir archivos .json por WhatsApp.
  const nombreArchivo = `entrega-${paquete.deviceId}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.txt`;
  return { paquete, nombreArchivo, contenido: JSON.stringify(paquete, null, 1), hastaSeq };
}

/**
 * Marca como entregados los nidos del paquete. Un nido editado después de armar el paquete
 * tiene un cambio nuevo en la outbox (seq mayor) y sigue pendiente.
 */
export async function marcarEntregados(
  nidos: Pick<Nido, 'id' | 'version'>[],
  hastaSeq: number,
  estado: 'entregado' | 'enviado',
  db: NidosDB = dbPorDefecto,
): Promise<void> {
  const ids = new Set(nidos.map((n) => n.id));
  await db.transaction('rw', db.outbox, db.nidos, async () => {
    await db.outbox.where('seq').belowOrEqual(hastaSeq).filter((c) => ids.has(c.nidoId)).delete();
    for (const n of nidos) {
      const actual = await db.nidos.get(n.id);
      if (actual && actual.version === n.version) await db.nidos.update(n.id, { syncStatus: estado });
    }
  });
}

export async function confirmarEntrega(entrega: Entrega, db: NidosDB = dbPorDefecto): Promise<void> {
  await marcarEntregados(entrega.paquete.nidos as Nido[], entrega.hastaSeq, 'entregado', db);
  await db.lotes.add({
    fecha: new Date().toISOString(),
    origen: 'exportacion',
    registros: entrega.paquete.nidos.length,
    archivo: entrega.nombreArchivo,
    contenido: entrega.contenido,
  });
}

export async function ultimaEntrega(db: NidosDB = dbPorDefecto) {
  return db.lotes.where('origen').equals('exportacion').last();
}
