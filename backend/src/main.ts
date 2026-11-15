import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

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
