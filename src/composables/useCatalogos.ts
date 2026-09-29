import { reactive } from 'vue';
import { valoresCatalogo } from '@/db/repositorio';
import { TIPOS_CATALOGO, type TipoCatalogo } from '@/domain/catalogos';

/** Opciones de cada lista desplegable, leídas de la base local (el coordinador podrá editarlas). */
export function useCatalogos() {
  const opciones = reactive(
    Object.fromEntries(TIPOS_CATALOGO.map((t) => [t, [] as string[]])) as Record<TipoCatalogo, string[]>,
  );
  for (const tipo of TIPOS_CATALOGO) {
    void valoresCatalogo(tipo).then((valores) => (opciones[tipo] = valores));
  }
  return opciones;
}
