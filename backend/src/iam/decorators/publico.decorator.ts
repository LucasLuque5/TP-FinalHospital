import { SetMetadata } from '@nestjs/common';

export const ES_PUBLICO = 'esPublico';

/** Marca una ruta que NO requiere haber iniciado sesión (ej. el login). */
export const Publico = () => SetMetadata(ES_PUBLICO, true);
