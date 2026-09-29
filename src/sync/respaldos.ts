import { db as dbPorDefecto, type NidosDB } from '@/db/database';
import { hoyISO } from '@/domain/formato';
import { armarPaqueteDe } from './entrega';

export const RESPALDOS_A_CONSERVAR = 7;

/** Copia completa de todos los nidos (incluidos los eliminados) dentro del teléfono. */
export async function crearRespaldo(db: NidosDB = dbPorDefecto): Promise<number> {
  const nidos = await db.nidos.toArray();
  const paquete = await armarPaqueteDe(nidos, 'respaldo', db);
  const id = await db.respaldos.add({
    fecha: new Date().toISOString(),
    registros: nidos.length,
    contenido: JSON.stringify(paquete),
  });
  const todos = await db.respaldos.orderBy('fecha').toArray();
  const sobran = todos.slice(0, Math.max(0, todos.length - RESPALDOS_A_CONSERVAR));
  await db.respaldos.bulkDelete(sobran.map((r) => r.id!));
  return id as number;
}

/** Un respaldo por día: se llama al abrir la app. Sin nidos no hay nada que respaldar. */
export async function asegurarRespaldoDiario(db: NidosDB = dbPorDefecto): Promise<boolean> {
  if ((await db.nidos.count()) === 0) return false;
  const ultimo = await db.respaldos.orderBy('fecha').last();
  if (ultimo && ultimo.fecha.slice(0, 10) >= hoyISO()) return false;
  await crearRespaldo(db);
  return true;
}
