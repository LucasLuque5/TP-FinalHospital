import httpClient from '@/shared/services/httpClient';
import type { Rol, Usuario, UsuarioSesion } from '@/shared/tipos';

/** Todas las llamadas al backend del módulo IAM. */
export const iamService = {
  async login(nombreUsuario: string, password: string) {
    const { data } = await httpClient.post<{ token: string; usuario: UsuarioSesion }>('/iam/login', {
      nombreUsuario,
      password,
    });
    return data;
  },
  async listarMedicos() {
    return (await httpClient.get<Usuario[]>('/iam/medicos')).data;
  },
  async listarRoles() {
    return (await httpClient.get<Rol[]>('/iam/roles')).data;
  },
  async listarUsuarios() {
    return (await httpClient.get<Usuario[]>('/iam/usuarios')).data;
  },
  async crearUsuario(datos: {
    nombreUsuario: string;
    password: string;
    nombre: string;
    apellido: string;
    rolId: number;
    pacienteId?: number;
  }) {
    return (await httpClient.post<Usuario>('/iam/usuarios', datos)).data;
  },
  async actualizarUsuario(id: number, cambios: { rolId?: number; activo?: boolean }) {
    return (await httpClient.patch<Usuario>(`/iam/usuarios/${id}`, cambios)).data;
  },
};
