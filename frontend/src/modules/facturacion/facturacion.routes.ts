import type { RouteRecordRaw } from 'vue-router';

const facturacionRoutes: RouteRecordRaw[] = [
  {
    path: '/facturacion/obras-sociales',
    name: 'obras-sociales-list',
    component: () => import('./views/ObrasSocialesView.vue'),
    meta: { titulo: 'Obras sociales', grupo: 'Facturación', roles: ['Administrador', 'Recepcionista'] },
  },
  {
    path: '/facturacion/coberturas-pacientes',
    name: 'coberturas-pacientes-list',
    component: () => import('./views/CoberturasPacientesView.vue'),
    meta: { titulo: 'Coberturas de pacientes', grupo: 'Facturación', roles: ['Administrador', 'Recepcionista'] },
  },
  {
    path: '/facturacion/facturas',
    name: 'facturas-list',
    component: () => import('./views/FacturasView.vue'),
    meta: { titulo: 'Facturas', grupo: 'Facturación', roles: ['Administrador'] },
  },
  {
    path: '/facturacion/facturas-items',
    name: 'facturas-items-list',
    component: () => import('./views/FacturasItemsView.vue'),
    meta: { titulo: 'Cargos (ítems)', grupo: 'Facturación', roles: ['Administrador'] },
  },
  {
    path: '/facturacion/reportes',
    name: 'reportes',
    component: () => import('./views/ReportesView.vue'),
    meta: { titulo: 'Reportes', grupo: 'Facturación', roles: ['Administrador'] },
  },
];

export default facturacionRoutes;
