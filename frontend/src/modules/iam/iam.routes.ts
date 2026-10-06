import type { RouteRecordRaw } from 'vue-router';

const iamRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./views/LoginView.vue'),
    meta: { publica: true },
  },
  {
    path: '/iam/usuarios',
    name: 'usuarios-list',
    component: () => import('./views/UsuariosView.vue'),
    meta: { titulo: 'Usuarios y roles', grupo: 'Seguridad', roles: ['Administrador'] },
  },
];

export default iamRoutes;
