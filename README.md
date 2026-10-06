# Hospital Information System

TP Integrador - Metodología de Sistemas

- **Stack:** Vue · NestJS · SQL Server
- **Arquitectura:** Diseño por Componentes

## Estructura

| Carpeta | Contenido |
|---|---|
| `backend/` | API REST en NestJS (6 módulos + notificaciones) |
| `frontend/` | Aplicación web en Vue 3 |
| `docs/modelo-datos/` | Scripts SQL: creación de tablas y datos iniciales |

## Requisitos

- Node.js 22.18 o superior (probado con Node 24)
- SQL Server (Express alcanza) con el "ODBC Driver 17 for SQL Server"

## Puesta en marcha

```bash
# 1) Backend
cd backend
npm install
copy .env.example .env        # y revisar DB_SERVIDOR y JWT_SECRETO
npm run db:crear              # crea la base HospitalDB con datos de prueba
npm run start:dev             # http://localhost:3000

# 2) Frontend (en otra terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Los usuarios de prueba están documentados al comienzo de
[`docs/modelo-datos/02-datos-iniciales.sql`](docs/modelo-datos/02-datos-iniciales.sql).

## Pruebas

```bash
cd backend
npm test            # pruebas unitarias de los patrones (State, Builder, Strategy)
npm run test:e2e    # historias de usuario de punta a punta (requiere db:crear + backend corriendo)
```

## Documentación

- [Cómo instalar y probar el sistema, paso a paso](docs/COMO-PROBAR.md)
- [Script DDL SQL Server](docs/modelo-datos/01-crear-base-de-datos.sql)
- [Datos iniciales](docs/modelo-datos/02-datos-iniciales.sql)
