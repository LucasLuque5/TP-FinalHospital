import type { RouteRecordRaw } from 'vue-router';

const hceRoutes: RouteRecordRaw[] = [
  {
    path: '/hce/pacientes',
    name: 'pacientes-list',
    component: () => import('./views/PacientesListView.vue'),
    meta: {
      titulo: 'Pacientes',
      grupo: 'Historia clínica',
      roles: ['Recepcionista', 'Administrador', 'Médico', 'Enfermero'],
    },
  },
  {
    path: '/hce/pacientes/:id/historia',
    name: 'historia-clinica',
    component: () => import('./views/HistoriaClinicaView.vue'),
    meta: { roles: ['Médico', 'Enfermero'] },
  },
];

export default hceRoutes;
