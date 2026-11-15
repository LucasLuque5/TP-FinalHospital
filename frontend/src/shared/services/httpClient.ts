import axios from 'axios';

export const URL_API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const CLAVE_TOKEN = 'hospital.token';

const httpClient = axios.create({
  baseURL: URL_API,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(CLAVE_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const esLogin = error.config?.url?.includes('/iam/login');
    if (error.response?.status === 401 && !esLogin) {
      sessionStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export function mensajeDeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'No se pudo conectar con el servidor. ¿Está encendido el backend?';
    const mensaje = error.response.data?.message;
    return Array.isArray(mensaje) ? mensaje.join(' ') : (mensaje ?? 'Ocurrió un error inesperado.');
  }
  return 'Ocurrió un error inesperado.';
}

export default httpClient;
