import { defineStore } from 'pinia';
import { CLAVE_TOKEN } from '@/shared/services/httpClient';
import type { NombreRol, UsuarioSesion } from '@/shared/tipos';
import { iamService } from '../services/iam.service';

const CLAVE_USUARIO = 'hospital.usuario';

function usuarioGuardado(): UsuarioSesion | null {
  const guardado = sessionStorage.getItem(CLAVE_USUARIO);
  return guardado ? JSON.parse(guardado) : null;
}

export const useSesionStore = defineStore('sesion', {
  state: () => ({
    usuario: usuarioGuardado(),
  }),

  getters: {
    estaAutenticado: (state): boolean => state.usuario !== null,

    tieneRol:
      (state) =>
      (...roles: NombreRol[]): boolean =>
        state.usuario !== null && roles.includes(state.usuario.rol),
  },

  actions: {
    async iniciarSesion(nombreUsuario: string, password: string) {
      const respuesta = await iamService.login(nombreUsuario, password);
      sessionStorage.setItem(CLAVE_TOKEN, respuesta.token);
      sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
      this.usuario = respuesta.usuario;
    },

    cerrarSesion() {
      sessionStorage.removeItem(CLAVE_TOKEN);
      sessionStorage.removeItem(CLAVE_USUARIO);
      this.usuario = null;
    },
  },
});
