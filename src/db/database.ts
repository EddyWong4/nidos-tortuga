import Dexie, { type EntityTable } from 'dexie';
import type { Nido, Perfil } from '@/domain/schemas';
import { catalogosIniciales, type CatalogoItem } from '@/domain/catalogos';

/** Un cambio pendiente de entregar (patrón outbox). */
export interface OutboxEntry {
  seq?: number;
  nidoId: string;
  version: number;
  createdAt: string;
}

export interface Borrador {
  id: string;
  nidoId: string | null;
  datos: unknown;
  updatedAt: string;
}

/** Historial de entregas (exportaciones) e importaciones. */
export interface Lote {
  id?: number;
  fecha: string;
  origen: 'exportacion' | 'importacion';
  registros: number;
  archivo: string;
  /** Contenido del archivo entregado, para poder volver a compartirlo. */
  contenido?: string;
  /** Resumen de una importación. */
  resumen?: ResumenImportacion;
}

export interface ResumenImportacion {
  nuevos: number;
  actualizados: number;
  sinCambios: number;
  antiguos: number;
  conflictos: number;
  rechazados: { folio: string; motivo: string }[];
}

export interface PerfilGuardado extends Perfil {
  id: 'actual';
}

/** Copia completa de la base, una por día, las últimas 7. */
export interface Respaldo {
  id?: number;
  fecha: string;
  registros: number;
  contenido: string;
}

/** Versión de un nido que fue reemplazada por otra (al importar o resolver un conflicto). */
export interface VersionAnterior {
  id?: number;
  nidoId: string;
  version: number;
  fecha: string;
  motivo: string;
  datos: Nido;
}

export interface Conflicto {
  id?: number;
  fecha: string;
  motivo: 'misma-version' | 'folio-duplicado';
  folio: string;
  archivo: string;
  /** 0 = pendiente, 1 = resuelto. Número porque IndexedDB no indexa booleanos. */
  resuelto: 0 | 1;
  actual: Nido;
  entrante: Nido;
}

export interface Ajuste {
  clave: string;
  valor: unknown;
}

export class NidosDB extends Dexie {
  nidos!: EntityTable<Nido, 'id'>;
  outbox!: EntityTable<OutboxEntry, 'seq'>;
  catalogos!: EntityTable<CatalogoItem, 'id'>;
  perfil!: EntityTable<PerfilGuardado, 'id'>;
  borradores!: EntityTable<Borrador, 'id'>;
  lotes!: EntityTable<Lote, 'id'>;
  respaldos!: EntityTable<Respaldo, 'id'>;
  historial!: EntityTable<VersionAnterior, 'id'>;
  conflictos!: EntityTable<Conflicto, 'id'>;
  ajustes!: EntityTable<Ajuste, 'clave'>;

  constructor(nombre = 'nidos-tortuga') {
    super(nombre);

    // Cada cambio de esquema es una versión nueva con su migración; nunca se edita una versión publicada.
    this.version(1).stores({
      nidos: 'id, &folio, fechaMuestreo, especie, syncStatus, updatedAt',
      outbox: '++seq, nidoId, createdAt',
      catalogos: 'id, tipo, [tipo+activo]',
      perfil: 'id',
      borradores: 'id, nidoId, updatedAt',
      lotes: '++id, fecha, origen',
    });

    // v2 (fase 3): respaldos diarios, historial de versiones, conflictos de importación y ajustes.
    this.version(2).stores({
      respaldos: '++id, fecha',
      historial: '++id, nidoId, fecha',
      conflictos: '++id, resuelto, fecha',
      ajustes: 'clave',
    });

    this.on('populate', (tx) => {
      tx.table('catalogos').bulkAdd(catalogosIniciales);
    });
  }
}

export const db = new NidosDB();

export async function leerAjuste<T>(clave: string, db: NidosDB, porDefecto: T): Promise<T> {
  const a = await db.ajustes.get(clave);
  return a ? (a.valor as T) : porDefecto;
}

export async function guardarAjuste(clave: string, valor: unknown, db: NidosDB): Promise<void> {
  await db.ajustes.put({ clave, valor });
}
