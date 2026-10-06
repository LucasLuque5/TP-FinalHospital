import type { RouteRecordRaw } from 'vue-router';

const admisionRoutes: RouteRecordRaw[] = [
  {
    path: '/admision/turnos',
    name: 'turnos-list',
    component: () => import('./views/TurnosListView.vue'),
    meta: {
      titulo: 'Turnos y agenda',
      grupo: 'Admisión',
      roles: ['Recepcionista', 'Administrador', 'Médico'],
    },
  },
  {
    path: '/admision/guardia',
    name: 'guardia',
    component: () => import('./views/GuardiaView.vue'),
    meta: { titulo: 'Guardia (triaje)', grupo: 'Admisión', roles: ['Enfermero', 'Médico'] },
  },
  {
    path: '/admision/mis-turnos',
    name: 'mis-turnos',
    component: () => import('./views/MisTurnosView.vue'),
    meta: { titulo: 'Mis turnos', grupo: 'Paciente', roles: ['Paciente'] },
  },
];

export default admisionRoutes;
