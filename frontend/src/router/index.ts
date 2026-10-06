import { createRouter, createWebHistory } from 'vue-router';
import { useSesionStore } from '@/modules/iam/stores/sesion';
import type { NombreRol } from '@/shared/tipos';
import admisionRoutes from '@/modules/admision/admision.routes';
import enfermeriaRoutes from '@/modules/enfermeria/enfermeria.routes';
import facturacionRoutes from '@/modules/facturacion/facturacion.routes';
import hceRoutes from '@/modules/hce/hce.routes';
import iamRoutes from '@/modules/iam/iam.routes';
import recursosRoutes from '@/modules/recursos/recursos.route';

// Datos extra que puede llevar cada ruta (campo "meta").
declare module 'vue-router' {
  interface RouteMeta {
    /** true = se puede ver sin iniciar sesión (solo el login). */
    publica?: boolean;
    /** Roles que pueden entrar. Si falta, entra cualquier usuario autenticado. */
    roles?: NombreRol[];
    /** Texto y grupo con el que aparece en el menú lateral. Sin título no aparece. */
    titulo?: string;
    grupo?: string;
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...iamRoutes, //los tres puntos sirven para desarmar el array "iamRoutes" porque es un array.
    ...admisionRoutes,
    ...hceRoutes,
    ...enfermeriaRoutes,
    ...recursosRoutes,
    ...facturacionRoutes,
    // Cualquier otra dirección (incluida "/") lleva al inicio del usuario.
    { path: '/:resto(.*)*', name: 'inicio', redirect: '/inicio' },
    { path: '/inicio', name: 'inicio-por-rol', component: { render: () => null } },
  ],
});

/** Primera pantalla del menú que el usuario tiene permitido ver. */
function pantallaInicial(rol: NombreRol): string {
  const primera = router
    .getRoutes()
    .find((ruta) => ruta.meta.titulo && (!ruta.meta.roles || ruta.meta.roles.includes(rol)));
  return primera?.path ?? '/login';
}

/**
 * GUARD DE NAVEGACIÓN: se ejecuta antes de entrar a cada pantalla.
 * Es la versión "frontend" de los guards del backend. OJO: esto solo mejora
 * la experiencia (oculta lo que no corresponde); la seguridad real la da el
 * backend, que vuelve a verificar el rol en cada petición.
 */
router.beforeEach((destino) => {
  const sesion = useSesionStore();

  if (destino.meta.publica) {
    // Si ya inició sesión, no tiene sentido mostrarle el login.
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
