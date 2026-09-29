import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import TabsPage from '@/views/TabsPage.vue';
import { usePerfilStore } from '@/stores/perfil';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/tabs/inicio' },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      { path: '', redirect: '/tabs/inicio' },
      { path: 'inicio', component: () => import('@/views/InicioPage.vue') },
      { path: 'nidos', component: () => import('@/views/NidosPage.vue') },
      { path: 'ajustes', component: () => import('@/views/AjustesPage.vue') },
    ],
  },
  { path: '/configuracion', component: () => import('@/views/ConfiguracionPage.vue') },
  { path: '/nidos/nuevo', component: () => import('@/views/FormularioPuestaPage.vue') },
  { path: '/nidos/:id', component: () => import('@/views/DetalleNidoPage.vue') },
  { path: '/nidos/:id/editar', component: () => import('@/views/FormularioPuestaPage.vue') },
  { path: '/nidos/:id/analisis', component: () => import('@/views/AnalisisPage.vue') },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Sin perfil no hay folio: el primer uso siempre pasa por la configuración del teléfono.
router.beforeEach(async (to) => {
  const perfil = usePerfilStore();
  await perfil.cargar();
  if (!perfil.perfil && to.path !== '/configuracion') return '/configuracion';
});

export default router;
