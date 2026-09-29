import { db as dbPorDefecto, type Conflicto, type NidosDB, type ResumenImportacion } from '@/db/database';
import { conFolioDe, decidir } from '@/domain/consolidacion';
import { folioConLetra } from '@/domain/folio';
import type { Nido } from '@/domain/schemas';
import type { PaqueteLeido } from './paquete';

/**
 * Junta los nidos de un archivo con los de este teléfono (modo coordinador o restaurar un respaldo).
 * Nunca pisa datos sin dejar rastro: lo reemplazado va al historial y las dudas quedan como conflictos.
 */
export async function importarPaquete(
  leido: PaqueteLeido,
  archivo: string,
  db: NidosDB = dbPorDefecto,
): Promise<ResumenImportacion> {
  const resumen: ResumenImportacion = {
    nuevos: 0,
    actualizados: 0,
    sinCambios: 0,
    antiguos: 0,
    conflictos: 0,
    rechazados: [...leido.rechazados],
  };
  const fecha = new Date().toISOString();

  await db.transaction('rw', [db.nidos, db.historial, db.conflictos, db.lotes, db.catalogos], async () => {
    for (const entrante of leido.nidos) {
      const porId = await db.nidos.get(entrante.id);
      const porFolio = porId ? undefined : await db.nidos.where('folio').equals(entrante.folio).first();
      const d = decidir(entrante, porId, porFolio);

      switch (d.tipo) {
        case 'nuevo':
          await db.nidos.add(entrante);
          resumen.nuevos++;
          break;
        case 'actualizar':
          await db.historial.add({
            nidoId: porId!.id,
            version: porId!.version,
            fecha,
            motivo: `Reemplazado por la versión ${entrante.version} de ${archivo}`,
            datos: porId!,
          });
          await db.nidos.put(conFolioDe(entrante, porId!));
          resumen.actualizados++;
          break;
        case 'igual':
          resumen.sinCambios++;
          break;
        case 'antiguo':
          resumen.antiguos++;
          break;
        case 'conflicto': {
          const actual = (porId ?? porFolio)!;
          // No repetir el mismo conflicto si se importa dos veces el mismo archivo.
          const yaRegistrado = await db.conflictos
            .where('resuelto')
            .equals(0)
            .filter((c) => c.entrante.id === entrante.id && c.entrante.version === entrante.version)
            .count();
          if (!yaRegistrado) {
            await db.conflictos.add({ fecha, motivo: d.motivo, folio: entrante.folio, archivo, resuelto: 0, actual, entrante });
          }
          resumen.conflictos++;
          break;
        }
      }
    }

    // Catálogos: se agregan los valores que no existan; nunca se borran ni se desactivan desde un archivo.
    for (const item of leido.paquete.catalogos) {
      if (!(await db.catalogos.get(item.id))) await db.catalogos.add(item);
    }

    await db.lotes.add({ fecha, origen: 'importacion', registros: leido.nidos.length, archivo, resumen });
  });

  return resumen;
}

export type AccionConflicto = 'conservar' | 'usarEntrante' | 'conservarAmbos';

/**
 * El coordinador decide: conservar lo que ya tiene, usar lo que viene en el archivo o, si son dos nidos
 * distintos con el mismo folio, conservar los dos (el entrante recibe una letra: B07-0001B).
 * Devuelve el folio con el que quedó el nido entrante, si se guardó.
 */
export async function resolverConflicto(
  id: number,
  accion: AccionConflicto,
  db: NidosDB = dbPorDefecto,
): Promise<string | null> {
  return db.transaction('rw', db.conflictos, db.nidos, db.historial, async () => {
    const c = (await db.conflictos.get(id)) as Conflicto | undefined;
    if (!c || c.resuelto) return null;
    let folioFinal: string | null = null;

    if (accion === 'conservarAmbos') {
      if (c.motivo !== 'folio-duplicado') throw new Error('Solo se conservan los dos cuando son nidos distintos');
      const ocupados = new Set((await db.nidos.toArray()).map((n) => n.folio));
      folioFinal = folioConLetra(c.entrante.folio, (f) => ocupados.has(f));
      await db.nidos.put({ ...(c.entrante as Nido), folio: folioFinal });
    } else if (accion === 'usarEntrante') {
      const actual = await db.nidos.get(c.actual.id);
      if (actual) {
        await db.historial.add({
          nidoId: actual.id,
          version: actual.version,
          fecha: new Date().toISOString(),
          motivo: `Reemplazado al resolver un conflicto (${c.archivo})`,
          datos: actual,
        });
        // Con folio duplicado son dos UUID distintos: se quita el actual para liberar el folio.
        if (actual.id !== c.entrante.id) await db.nidos.delete(actual.id);
      }
      const nuevo = actual && actual.id === c.entrante.id ? conFolioDe(c.entrante as Nido, actual) : (c.entrante as Nido);
      await db.nidos.put(nuevo);
      folioFinal = nuevo.folio;
    }
    await db.conflictos.update(id, { resuelto: 1 });
    return folioFinal;
  });
}
