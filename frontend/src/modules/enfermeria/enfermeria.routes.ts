import type { RouteRecordRaw } from 'vue-router';

const enfermeriaRoutes: RouteRecordRaw[] = [
  {
    path: '/enfermeria/signos-vitales',
    name: 'signos-vitales-list',
    component: () => import('./views/SignosVitalesView.vue'),
    meta: { titulo: 'Signos vitales', grupo: 'Enfermería', roles: ['Enfermero', 'Médico'] },
  },
  {
    path: '/enfermeria/protocolos',
    name: 'protocolos-list',
    component: () => import('./views/ProtocolosView.vue'),
    meta: { titulo: 'Protocolos de atención', grupo: 'Enfermería', roles: ['Enfermero', 'Médico'] },
  },
  {
    path: '/enfermeria/medicacion',
    name: 'medicacion-list',
    component: () => import('./views/MedicacionView.vue'),
    meta: { titulo: 'Medicación', grupo: 'Enfermería', roles: ['Enfermero', 'Médico'] },
  },
];

export default enfermeriaRoutes;
