import { defineStore } from 'pinia';
import { CLAVE_TOKEN } from '@/shared/services/httpClient';
import type { NombreRol, UsuarioSesion } from '@/shared/tipos';
import { iamService } from '../services/iam.service';

const CLAVE_USUARIO = 'hospital.usuario';

/** Lee el usuario guardado en el navegador (si había una sesión abierta antes de un F5). */
function usuarioGuardado(): UsuarioSesion | null {
  const guardado = sessionStorage.getItem(CLAVE_USUARIO);
  return guardado ? JSON.parse(guardado) : null;
}

/**
 * STORE DE SESIÓN (Pinia, sintaxis de opciones)
 * Guarda quién inició sesión. Cualquier componente puede consultarlo.
 *
 *  - state:   los datos (el usuario conectado).
 *  - getters: valores calculados a partir del state (como un computed).
 *  - actions: funciones que modifican el state.
 *
 * PERSISTENCIA: el usuario y el token se copian en sessionStorage, así la
 * sesión sobrevive a un F5 pero se borra al cerrar la pestaña. Además, cada
 * pestaña tiene su propia sesión: se puede abrir una como recepción y otra
 * como médico.
 */
export const useSesionStore = defineStore('sesion', {
  state: () => ({
    usuario: usuarioGuardado(),
  }),

  getters: {
    estaAutenticado: (state): boolean => state.usuario !== null,

    /** ¿El usuario tiene alguno de estos roles?  Ej: sesion.tieneRol('Médico', 'Enfermero') */
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
