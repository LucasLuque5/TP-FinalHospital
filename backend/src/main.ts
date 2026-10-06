import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: permite que el frontend (otro puerto) le haga peticiones al backend.
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' });

  // Valida automáticamente los datos de entrada usando los DTO.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta propiedades que no estén en el DTO
      forbidNonWhitelisted: true, // ...y además responde error si llegan
      transform: true, // convierte tipos (ej. "5" -> 5 en parámetros)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
