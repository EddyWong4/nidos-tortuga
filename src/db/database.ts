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

/** Historial de exportaciones e importaciones. */
export interface Lote {
  id?: number;
  fecha: string;
  origen: 'exportacion' | 'importacion';
  registros: number;
  archivo: string;
}

export interface PerfilGuardado extends Perfil {
  id: 'actual';
}

export class NidosDB extends Dexie {
  nidos!: EntityTable<Nido, 'id'>;
  outbox!: EntityTable<OutboxEntry, 'seq'>;
  catalogos!: EntityTable<CatalogoItem, 'id'>;
  perfil!: EntityTable<PerfilGuardado, 'id'>;
  borradores!: EntityTable<Borrador, 'id'>;
  lotes!: EntityTable<Lote, 'id'>;

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

    this.on('populate', (tx) => {
      tx.table('catalogos').bulkAdd(catalogosIniciales);
    });
  }
}

export const db = new NidosDB();
