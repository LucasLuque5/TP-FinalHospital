import type { RouteRecordRaw } from 'vue-router';

/**
 * RUTAS ANIDADAS: /facturacion es la ruta "padre" y dibuja FacturacionLayout
 * (título y pestañas). Cada ruta "hija" se dibuja DENTRO de ese layout, en
 * su <RouterView />. Las direcciones completas quedan, por ejemplo:
 *   /facturacion/obras-sociales,  /facturacion/facturas, ...
 */
const facturacionRoutes: RouteRecordRaw[] = [
  {
    path: '/facturacion',
    name: 'facturacion',
    component: () => import('./views/FacturacionLayout.vue'),
    redirect: { name: 'obras-sociales-list' }, // /facturacion sola abre la primera pestaña
    children: [
      {
        path: 'obras-sociales',
        name: 'obras-sociales-list',
        component: () => import('./views/ObrasSocialesView.vue'),
        meta: { titulo: 'Obras sociales', grupo: 'Facturación', roles: ['Administrador', 'Recepcionista'] },
      },
      {
        path: 'coberturas-pacientes',
        name: 'coberturas-pacientes-list',
        component: () => import('./views/CoberturasPacientesView.vue'),
        meta: { titulo: 'Coberturas de pacientes', grupo: 'Facturación', roles: ['Administrador', 'Recepcionista'] },
      },
      {
        path: 'facturas',
        name: 'facturas-list',
        component: () => import('./views/FacturasView.vue'),
        meta: { titulo: 'Facturas', grupo: 'Facturación', roles: ['Administrador'] },
      },
      {
        path: 'facturas-items',
        name: 'facturas-items-list',
        component: () => import('./views/FacturasItemsView.vue'),
        meta: { titulo: 'Cargos (ítems)', grupo: 'Facturación', roles: ['Administrador'] },
      },
      {
        path: 'reportes',
        name: 'reportes',
        component: () => import('./views/ReportesView.vue'),
        meta: { titulo: 'Reportes', grupo: 'Facturación', roles: ['Administrador'] },
      },
    ],
  },
];

export default facturacionRoutes;
