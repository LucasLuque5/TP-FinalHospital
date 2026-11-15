import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import mssqlNativo from 'mssql/msnodesqlv8.js';

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
    options: { useUTC: true },
    autoLoadEntities: true,
    synchronize: false,
  };
}
