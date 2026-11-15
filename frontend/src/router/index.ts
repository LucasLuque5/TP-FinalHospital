import { createRouter, createWebHistory } from 'vue-router';
import { useSesionStore } from '@/modules/iam/stores/sesion';
import type { NombreRol } from '@/shared/tipos';
import admisionRoutes from '@/modules/admision/admision.routes';
import enfermeriaRoutes from '@/modules/enfermeria/enfermeria.routes';
import facturacionRoutes from '@/modules/facturacion/facturacion.routes';
import hceRoutes from '@/modules/hce/hce.routes';
import iamRoutes from '@/modules/iam/iam.routes';
import recursosRoutes from '@/modules/recursos/recursos.route';

declare module 'vue-router' {
  interface RouteMeta {
    publica?: boolean;
    roles?: NombreRol[];
    titulo?: string;
    grupo?: string;
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...iamRoutes,
    ...admisionRoutes,
    ...hceRoutes,
    ...enfermeriaRoutes,
    ...recursosRoutes,
    ...facturacionRoutes,
    { path: '/:resto(.*)*', name: 'inicio', redirect: '/inicio' },
    { path: '/inicio', name: 'inicio-por-rol', component: { render: () => null } },
  ],
});

function pantallaInicial(rol: NombreRol): string {
  const primera = router
    .getRoutes()
    .find((ruta) => ruta.meta.titulo && (!ruta.meta.roles || ruta.meta.roles.includes(rol)));
  return primera?.path ?? '/login';
}

router.beforeEach((destino) => {
  const sesion = useSesionStore();

  if (destino.meta.publica) {
    return sesion.usuario ? pantallaInicial(sesion.usuario.rol) : true;
  }
  if (!sesion.usuario) return '/login';

  if (destino.name === 'inicio-por-rol') return pantallaInicial(sesion.usuario.rol);

  if (destino.meta.roles && !destino.meta.roles.includes(sesion.usuario.rol)) {
    return pantallaInicial(sesion.usuario.rol);
  }
  return true;
});

export default router;
