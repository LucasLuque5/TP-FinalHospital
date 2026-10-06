import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rol } from './entities/rol.entity.js';
import { Usuario } from './entities/usuario.entity.js';
import { AuthGuard } from './guards/auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { IamController } from './iam.controller.js';
import { IamService } from './iam.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Rol]),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRETO'),
        signOptions: { expiresIn: config.get('JWT_DURACION', '8h') },
      }),
    }),
  ],
  controllers: [IamController],
  providers: [
    IamService,
    // APP_GUARD registra los guards para TODAS las rutas del sistema.
    // Por eso IAM es "transversal": protege a los demás módulos sin que
    // ellos tengan que hacer nada. El orden importa: primero se autentica
    // (AuthGuard) y después se autoriza (RolesGuard).
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [IamService],
})
export class IamModule {}
