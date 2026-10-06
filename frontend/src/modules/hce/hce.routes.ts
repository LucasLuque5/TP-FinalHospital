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
    // ":id" es un parámetro: /hce/pacientes/3/historia abre la historia del paciente 3.
    path: '/hce/pacientes/:id/historia',
    name: 'historia-clinica',
    component: () => import('./views/HistoriaClinicaView.vue'),
    meta: { roles: ['Médico', 'Enfermero'] },
  },
];

export default hceRoutes;
