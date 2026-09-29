import { conFolioDe, decidir } from '../../src/domain/consolidacion';
import { catalogosIniciales } from '../../src/domain/catalogos';
import type { Nido } from '../../src/domain/schemas';
import type { PaqueteLeido } from '../../src/sync/paquete';
import type { Db } from './db';

// Las mismas reglas que el modo coordinador de la app (src/domain/consolidacion.ts).

export interface ResultadoPush {
  aceptados: { id: string; version: number }[];
  conflictos: { id: string; folio: string; motivo: string }[];
  rechazados: { folio: string; motivo: string }[];
}

const leerNido = async (db: Db, sql: string, valor: string): Promise<Nido | undefined> =>
  (await db.query<{ datos: Nido }>(sql, [valor])).rows[0]?.datos;

async function guardarNido(db: Db, n: Nido, dispositivo: string, esNuevo: boolean) {
  const valores = [
    n.id, n.folio, n.campamentoId, n.deviceId, n.version, n.fechaMuestreo, n.especie,
    n.lat, n.lng, n.deleted, JSON.stringify(n), n.updatedAt, dispositivo,
  ];
  if (esNuevo) {
    await db.query(
      `INSERT INTO nidos (id, folio, campamento_id, device_id, version, fecha_muestreo, especie, lat, lng, eliminado, datos, actualizado, recibido_de)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      valores,
    );
  } else {
    await db.query(
      `UPDATE nidos SET folio=$2, campamento_id=$3, device_id=$4, version=$5, fecha_muestreo=$6, especie=$7, lat=$8, lng=$9,
         eliminado=$10, datos=$11, actualizado=$12, recibido_de=$13, recibido=now()
       WHERE id=$1`,
      valores,
    );
  }
}

export async function recibirPaquete(db: Db, leido: PaqueteLeido, dispositivo: string): Promise<ResultadoPush> {
  const resultado: ResultadoPush = { aceptados: [], conflictos: [], rechazados: [...leido.rechazados] };

  await db.transaccion(async (tx) => {
    for (const recibido of leido.nidos) {
      // En el servidor el estado de entrega siempre es "enviado".
      const entrante: Nido = { ...recibido, syncStatus: 'enviado' };
      const porId = await leerNido(tx, 'SELECT datos FROM nidos WHERE id = $1', entrante.id);
      const porFolio = porId ? undefined : await leerNido(tx, 'SELECT datos FROM nidos WHERE folio = $1', entrante.folio);
      const d = decidir(entrante, porId, porFolio);

      switch (d.tipo) {
        case 'nuevo':
          await guardarNido(tx, entrante, dispositivo, true);
          break;
        case 'actualizar':
          await tx.query('INSERT INTO nidos_historial (nido_id, version, datos, motivo) VALUES ($1,$2,$3,$4)', [
            porId!.id,
            porId!.version,
            JSON.stringify(porId),
            `Reemplazado por la versión ${entrante.version} enviada por ${dispositivo}`,
          ]);
          await guardarNido(tx, conFolioDe(entrante, porId!), dispositivo, false);
          break;
        case 'igual':
        case 'antiguo':
          break;
        case 'conflicto': {
          const repetido = await tx.query(
            `SELECT 1 FROM conflictos WHERE NOT resuelto AND entrante->>'id' = $1 AND (entrante->>'version')::int = $2`,
            [entrante.id, entrante.version],
          );
          if (!repetido.rows.length) {
            await tx.query(
              'INSERT INTO conflictos (motivo, folio, actual, entrante, recibido_de) VALUES ($1,$2,$3,$4,$5)',
              [d.motivo, entrante.folio, JSON.stringify(porId ?? porFolio), JSON.stringify(entrante), dispositivo],
            );
          }
          resultado.conflictos.push({ id: entrante.id, folio: entrante.folio, motivo: d.motivo });
          continue;
        }
      }
      // "igual" y "antiguo" también cuentan como aceptados: el servidor ya tiene esa versión o una más nueva.
      resultado.aceptados.push({ id: entrante.id, version: entrante.version });
    }
  });

  return resultado;
}

export async function sembrarCatalogos(db: Db): Promise<void> {
  for (const c of catalogosIniciales) {
    await db.query(
      'INSERT INTO catalogos (id, tipo, valor, orden, activo) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING',
      [c.id, c.tipo, c.valor, c.orden, c.activo],
    );
  }
}
