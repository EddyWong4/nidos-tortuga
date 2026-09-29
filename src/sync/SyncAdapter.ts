import type { Nido } from '@/domain/schemas';
import type { CatalogoItem } from '@/domain/catalogos';

// La interfaz nunca habla con internet: el SyncService entrega la outbox con el adaptador configurado.
// Fase 3: ExportAdapter (archivo JSON para el coordinador). Fase 6: ApiAdapter (REST + PostgreSQL).

export const VERSION_ESQUEMA = 1;

/** Lo que viaja en un archivo o en una petición: siempre con versión de esquema y catálogos usados. */
export interface Paquete {
  versionEsquema: number;
  generadoEn: string;
  deviceId: string;
  observador: string;
  nidos: Nido[];
  catalogos: CatalogoItem[];
}

export interface ResultadoPush {
  entregados: string[];
  conflictos: { nidoId: string; motivo: string }[];
}

export interface SyncAdapter {
  readonly nombre: string;
  /** Entrega los nidos con cambios pendientes. */
  push(paquete: Paquete): Promise<ResultadoPush>;
  /** Opcional: trae catálogos o datos del servidor. */
  pull?(desde: string): Promise<Paquete>;
}
