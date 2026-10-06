import { CLAVE_TOKEN, URL_API } from './httpClient';

export interface MensajeEnVivo {
  tipo: 'notificacion' | 'actualizacion';
  datos: any;
}

/**
 * Se conecta al canal en tiempo real del backend (Server-Sent Events).
 *
 * El navegador trae una clase para esto (EventSource), pero no permite
 * enviar la cabecera Authorization con el token. Por eso se usa fetch y
 * se va leyendo la respuesta de a pedazos a medida que llegan mensajes.
 *
 * Devuelve una función para cortar la conexión.
 */
export function conectarEnVivo(alRecibir: (mensaje: MensajeEnVivo) => void): () => void {
  const control = new AbortController();

  async function escuchar() {
    const respuesta = await fetch(`${URL_API}/notificaciones/en-vivo`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem(CLAVE_TOKEN)}` },
      signal: control.signal,
    });
    if (!respuesta.ok || !respuesta.body) return;

    const lector = respuesta.body.getReader();
    const decodificador = new TextDecoder();
    let pendiente = '';

    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      pendiente += decodificador.decode(value, { stream: true });

      // Cada mensaje termina con una línea en blanco.
      const bloques = pendiente.split('\n\n');
      pendiente = bloques.pop() ?? '';
      for (const bloque of bloques) {
        const linea = bloque.split('\n').find((l) => l.startsWith('data:'));
        if (linea) alRecibir(JSON.parse(linea.slice(5)));
      }
    }
  }

  // Si la conexión se corta (ej. se reinició el backend) se reintenta a los 5 segundos.
  async function mantenerConexion() {
    while (!control.signal.aborted) {
      try {
        await escuchar();
      } catch {
        /* se reintenta abajo */
      }
      if (!control.signal.aborted) await new Promise((resolver) => setTimeout(resolver, 5000));
    }
  }
  void mantenerConexion();

  return () => control.abort();
}
