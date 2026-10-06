import axios from 'axios';

/** URL del backend. Se puede cambiar creando un archivo .env con VITE_API_URL=... */
export const URL_API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/** Nombre con el que se guarda el token en el navegador. */
export const CLAVE_TOKEN = 'hospital.token';

const httpClient = axios.create({
  baseURL: URL_API, // URL del backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTOR DE PETICIONES: antes de que salga cada petición, se le agrega
// el token JWT. Así ninguna pantalla tiene que acordarse de enviarlo.
httpClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(CLAVE_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// INTERCEPTOR DE RESPUESTAS: si el backend responde 401 (sesión vencida o
// inválida) se borra la sesión y se vuelve a la pantalla de login.
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

/** Extrae el mensaje de error que envía el backend para mostrárselo al usuario. */
export function mensajeDeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'No se pudo conectar con el servidor. ¿Está encendido el backend?';
    const mensaje = error.response.data?.message;
    // Los errores de validación llegan como una lista de mensajes.
    return Array.isArray(mensaje) ? mensaje.join(' ') : (mensaje ?? 'Ocurrió un error inesperado.');
  }
  return 'Ocurrió un error inesperado.';
}

export default httpClient;
