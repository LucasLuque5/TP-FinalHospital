import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { CLAVE_TOKEN } from '@/shared/services/httpClient';
import type { NombreRol, UsuarioSesion } from '@/shared/tipos';
import { iamService } from '../services/iam.service';

const CLAVE_USUARIO = 'hospital.usuario';

/**
 * STORE DE SESIÓN (Pinia)
 * Guarda quién inició sesión. Cualquier componente puede consultarlo.
 *
 * Se usa sessionStorage para que la sesión sobreviva a un F5 pero se
 * borre al cerrar la pestaña. Además, cada pestaña tiene su propia
 * sesión: se puede abrir una como recepción y otra como médico.
 */
export const useSesionStore = defineStore('sesion', () => {
  const guardado = sessionStorage.getItem(CLAVE_USUARIO);
  const usuario = ref<UsuarioSesion | null>(guardado ? JSON.parse(guardado) : null);

  const estaAutenticado = computed(() => usuario.value !== null);

  async function iniciarSesion(nombreUsuario: string, password: string) {
    const respuesta = await iamService.login(nombreUsuario, password);
    sessionStorage.setItem(CLAVE_TOKEN, respuesta.token);
    sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
    usuario.value = respuesta.usuario;
  }

  function cerrarSesion() {
    sessionStorage.removeItem(CLAVE_TOKEN);
    sessionStorage.removeItem(CLAVE_USUARIO);
    usuario.value = null;
  }

  /** ¿El usuario tiene alguno de estos roles?  Ej: sesion.tieneRol('Médico', 'Enfermero') */
  function tieneRol(...roles: NombreRol[]): boolean {
    return usuario.value !== null && roles.includes(usuario.value.rol);
  }

  return { usuario, estaAutenticado, iniciarSesion, cerrarSesion, tieneRol };
});
