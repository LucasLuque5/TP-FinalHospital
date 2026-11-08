import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  // Documentación interactiva de la API (Swagger): http://localhost:3000/api/docs
  // Lista todas las rutas agrupadas por módulo y permite probarlas desde el navegador.
  const documentacion = new DocumentBuilder()
    .setTitle('Hospital Information System - API')
    .setDescription(
      'Para probar las rutas protegidas: ejecutar POST /iam/login, copiar el "token" ' +
        'de la respuesta y pegarlo en el botón "Authorize".',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();
  SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, documentacion));

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
