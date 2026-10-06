import type { RouteRecordRaw } from 'vue-router';

const recursosRoutes: RouteRecordRaw[] = [
  {
    path: '/recursos/camas',
    name: 'camas-list',
    component: () => import('./views/CamasListView.vue'),
    meta: {
      titulo: 'Mapa de camas',
      grupo: 'Recursos',
      roles: ['Recepcionista', 'Administrador', 'Médico', 'Enfermero'],
    },
  },
  {
    path: '/recursos/habitaciones',
    name: 'habitaciones-list',
    component: () => import('./views/HabitacionesListView.vue'),
    meta: { titulo: 'Habitaciones', grupo: 'Recursos', roles: ['Recepcionista', 'Administrador'] },
  },
  {
    path: '/recursos/camas-historial',
    name: 'camas-historial-list',
    component: () => import('./views/CamasHistorialListView.vue'),
    meta: { titulo: 'Historial de camas', grupo: 'Recursos', roles: ['Recepcionista', 'Administrador'] },
  },
  {
    path: '/recursos/insumos',
    name: 'insumos-list',
    component: () => import('./views/InsumosListView.vue'),
    meta: { titulo: 'Insumos', grupo: 'Recursos', roles: ['Administrador', 'Enfermero', 'Médico'] },
  },
  {
    path: '/recursos/movimientos-inventarios',
    name: 'movimientos-inventarios-list',
    component: () => import('./views/MovimientosInventariosListView.vue'),
    meta: { titulo: 'Movimientos de inventario', grupo: 'Recursos', roles: ['Administrador'] },
  },
];

export default recursosRoutes;
