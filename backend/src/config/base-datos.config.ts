import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import mssqlNativo from 'mssql/msnodesqlv8.js';

/**
 * Arma la configuración de TypeORM para SQL Server leyendo el archivo .env.
 *
 * Usamos el driver nativo (ODBC) porque permite "Autenticación de Windows",
 * que es como viene configurado SQL Server Express por defecto: no hace
 * falta crear usuarios de SQL ni habilitar TCP/IP en el servidor.
 */
export function configurarBaseDeDatos(config: ConfigService): TypeOrmModuleOptions {
  const partes = [
    `Driver={${config.get('DB_DRIVER_ODBC', 'ODBC Driver 17 for SQL Server')}}`,
    `Server=${config.get('DB_SERVIDOR', '.\\SQLEXPRESS')}`,
    `Database=${config.get('DB_NOMBRE', 'HospitalDB')}`,
    'TrustServerCertificate=yes',
  ];

  if (config.get('DB_AUTENTICACION', 'windows') === 'windows') {
    partes.push('Trusted_Connection=yes');
  } else {
    partes.push(`Uid=${config.get('DB_USUARIO')}`, `Pwd=${config.get('DB_PASSWORD')}`);
  }

  return {
    type: 'mssql',
    driver: mssqlNativo,
    database: config.get('DB_NOMBRE', 'HospitalDB'),
    extra: { connectionString: partes.join(';') + ';' },
    // Las fechas con hora se guardan en UTC (hora universal) y se leen como UTC.
    // El frontend las convierte a la hora local del usuario al mostrarlas.
    options: { useUTC: true },
    // Cada módulo registra sus entidades con TypeOrmModule.forFeature()
    autoLoadEntities: true,
    // IMPORTANTE: false. Las tablas se crean con el script SQL, no las inventa TypeORM.
    synchronize: false,
  };
}
