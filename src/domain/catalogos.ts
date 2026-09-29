// Catálogos iniciales (tomados de la app anterior). El coordinador podrá editarlos desde la app.

export const TIPOS_CATALOGO = [
  'especie',
  'municipio',
  'zonaAnidacion',
  'tipoIncubacion',
  'estatusAnalisis',
  'perdidaNidada',
] as const;

export type TipoCatalogo = (typeof TIPOS_CATALOGO)[number];

export interface CatalogoItem {
  id: string;
  tipo: TipoCatalogo;
  valor: string;
  orden: number;
  /** 1 = visible en los formularios. Número y no booleano porque IndexedDB no indexa booleanos. */
  activo: 0 | 1;
}

const valores: Record<TipoCatalogo, string[]> = {
  especie: ['Laúd', 'Verde', 'Caguama', 'Carey', 'Lora'],
  municipio: ['Nautla', 'Vega de Alatorre'],
  zonaAnidacion: ['A', 'B', 'C'],
  tipoIncubacion: ['In situ', 'Reubicado In situ', 'Raudal', 'Laurel', 'Tortugas'],
  estatusAnalisis: ['Completo', 'Pendiente', 'Incompleto', 'Sin análisis'],
  perdidaNidada: ['Erosionada', 'Depredada', 'Inundada', 'Saqueada', 'Manejado por otro campamento'],
};

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const catalogosIniciales: CatalogoItem[] = TIPOS_CATALOGO.flatMap((tipo) =>
  valores[tipo].map((valor, orden) => ({ id: `${tipo}:${slug(valor)}`, tipo, valor, orden, activo: 1 as const })),
);
