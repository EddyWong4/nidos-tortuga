import { defineStore } from 'pinia';
import { ref } from 'vue';
import { guardarPerfil, obtenerPerfil } from '@/db/repositorio';
import type { Perfil } from '@/domain/schemas';

// Por ahora la app sirve a un solo campamento; el id viaja en cada nido para admitir más en el futuro.
export const CAMPAMENTO = { id: 'campamento-principal', nombre: 'Campamento principal' } as const;

export const usePerfilStore = defineStore('perfil', () => {
  const perfil = ref<Perfil | null>(null);
  const cargado = ref(false);

  async function cargar() {
    if (cargado.value) return;
    perfil.value = (await obtenerPerfil()) ?? null;
    cargado.value = true;
  }

  async function guardar(nuevo: Perfil) {
    await guardarPerfil(nuevo);
    perfil.value = nuevo;
  }

  /** El consecutivo avanza en la base al crear un nido; aquí solo se refresca la copia en memoria. */
  async function refrescar() {
    perfil.value = (await obtenerPerfil()) ?? null;
  }

  return { perfil, cargado, cargar, guardar, refrescar };
});
