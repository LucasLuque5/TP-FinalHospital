# Frontend — Hospital Information System

Aplicación web en **Vue 3 + TypeScript**, con Vite, vue-router, Pinia y Axios.

La descripción del proyecto, la instalación completa y los usuarios de prueba están en el
[README principal](../README.md).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias |
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run type-check` | Revisa los tipos de todo el proyecto |
| `npm run build` | Revisa tipos y genera la versión final en `dist/` |

La URL del backend se puede cambiar creando un archivo `.env` con
`VITE_API_URL=http://servidor:puerto` (por defecto, `http://localhost:3000`).

## Organización

```
src/
├── main.ts            crea la aplicación y le conecta Pinia y el router
├── App.vue            marco general: menú, notificaciones y <RouterView />
├── router/            rutas de todos los módulos y guarda de navegación por rol
├── modules/           un componente de negocio por carpeta
│   └── <módulo>/
│       ├── <módulo>.routes.ts
│       ├── services/  llamadas al backend
│       ├── components/ (opcional) piezas propias del módulo
│       └── views/     pantallas
└── shared/
    ├── components/    componentes reutilizables (EtiquetaEstado, SelectorPaciente, TarjetaSeccion…)
    ├── composables/   useAccion (carga y errores) y useMonitor (tiempo real)
    ├── stores/        notificaciones
    ├── services/      cliente HTTP con token y canal en vivo
    └── utils/         formato de fechas, horas y dinero
```
