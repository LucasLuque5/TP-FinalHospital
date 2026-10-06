// Crea (o recrea) la base de datos HospitalDB ejecutando los scripts .sql
// de la carpeta docs/modelo-datos. Uso:  npm run db:crear
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sql from 'mssql/msnodesqlv8.js';

const carpetaBackend = join(dirname(fileURLToPath(import.meta.url)), '..');
const carpetaScripts = join(carpetaBackend, '..', 'docs', 'modelo-datos');

// Lee las variables del archivo .env (misma configuración que usa el backend)
const archivoEnv = join(carpetaBackend, '.env');
if (existsSync(archivoEnv)) process.loadEnvFile(archivoEnv);

function armarCadenaConexion(baseDeDatos) {
  const partes = [
    `Driver={${process.env.DB_DRIVER_ODBC ?? 'ODBC Driver 17 for SQL Server'}}`,
    `Server=${process.env.DB_SERVIDOR ?? '.\\SQLEXPRESS'}`,
    `Database=${baseDeDatos}`,
    'TrustServerCertificate=yes',
  ];
  if ((process.env.DB_AUTENTICACION ?? 'windows') === 'windows') {
    partes.push('Trusted_Connection=yes');
  } else {
    partes.push(`Uid=${process.env.DB_USUARIO}`, `Pwd=${process.env.DB_PASSWORD}`);
  }
  return partes.join(';') + ';';
}

// Nos conectamos a "master" porque HospitalDB todavía puede no existir.
const pool = await new sql.ConnectionPool({
  connectionString: armarCadenaConexion('master'),
}).connect();

try {
  for (const archivo of ['01-crear-base-de-datos.sql', '02-datos-iniciales.sql']) {
    console.log(`Ejecutando ${archivo}...`);
    const contenido = readFileSync(join(carpetaScripts, archivo), 'utf8');
    // "GO" no es SQL: es un separador de lotes que entienden SSMS y sqlcmd.
    // Acá lo usamos para cortar el archivo y enviar cada lote por separado.
    const lotes = contenido.split(/^\s*GO\s*$/im).filter((lote) => lote.trim() !== '');
    for (const lote of lotes) {
      await pool.request().batch(lote);
    }
  }
  console.log('Listo: base de datos HospitalDB creada y con datos iniciales.');
} catch (error) {
  console.error('No se pudo crear la base de datos:', error.message);
  process.exitCode = 1;
} finally {
  await pool.close();
}
