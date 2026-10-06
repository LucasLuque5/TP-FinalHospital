# Cómo instalar y probar el sistema

Guía para levantar el proyecto en una computadora nueva y recorrer todas las historias de
usuario. Tiempo estimado: 10 minutos de instalación y 15 de recorrido.

## 1. Requisitos

| Programa | Versión | Cómo comprobarlo |
|---|---|---|
| Node.js | 22.18 o superior | `node -v` en una terminal |
| SQL Server | Cualquier edición (Express alcanza) | Poder entrar con SQL Server Management Studio (SSMS) |
| ODBC Driver 17 for SQL Server | Se instala junto con SSMS | Buscar "Orígenes de datos ODBC" en Windows → pestaña "Controladores" |

## 2. Instalación (una sola vez)

### Backend

Abrir una terminal en la carpeta del proyecto:

```bash
cd backend
npm install
copy .env.example .env
```

Abrir `backend/.env` y revisar:

| Variable | Qué poner |
|---|---|
| `DB_SERVIDOR` | El mismo nombre de servidor con el que entran a SSMS. Lo habitual es `.\SQLEXPRESS` |
| `JWT_SECRETO` | Cualquier texto largo |

Crear la base de datos con los datos de prueba:

```bash
npm run db:crear
```

Debe terminar con `Listo: base de datos HospitalDB creada y con datos iniciales.`

> No hace falta crear usuarios en SQL Server ni habilitar TCP/IP: el proyecto se conecta con
> Autenticación de Windows, igual que SSMS.

### Frontend

En otra terminal:

```bash
cd frontend
npm install
```

## 3. Ejecución (cada vez)

**Terminal 1:**

```bash
cd backend
npm run start:dev
```

Esperar el mensaje `Nest application successfully started`.

**Terminal 2:**

```bash
cd frontend
npm run dev
```

Abrir **http://localhost:5173** en el navegador.

## 4. Usuarios de prueba

Todos usan la contraseña `Hospital123`.

| Usuario | Rol | Persona |
|---|---|---|
| `admin` | Administrador | Admin General |
| `dsilva` | Médico | Dr. Roberto Silva |
| `mtorres` | Enfermero | Martín Torres |
| `recepcion` | Recepcionista | Paula Díaz |
| `clopez` | Paciente | Carlos López |

**Consejo:** abrir dos ventanas del navegador (una normal y una de incógnito). Cada una
puede tener un usuario distinto, y así se ven las alertas y actualizaciones en tiempo real.

## 5. Si algo falla

| Problema | Solución |
|---|---|
| `No se encuentra el nombre del origen de datos…` | El driver ODBC de `.env` no está instalado. Mirar cuál tienen en "Orígenes de datos ODBC" → Controladores y poner ese nombre exacto en `DB_DRIVER_ODBC` |
| `npm run db:crear` tarda mucho y falla | `DB_SERVIDOR` está mal. Copiar el nombre exacto del servidor desde SSMS |
| `Login failed for user…` | El usuario de Windows no tiene permiso en SQL Server. Alternativa: poner `DB_AUTENTICACION=sql` y completar `DB_USUARIO` y `DB_PASSWORD` |
| La pantalla dice "No se pudo conectar con el servidor" | El backend no está corriendo |
| `EADDRINUSE … 3000` | Ya hay un backend abierto en otra terminal |
| Quiero empezar de cero | `npm run db:crear` deja la base como nueva |

---

## 6. Recorrido de prueba

**Antes de empezar, ejecutar `npm run db:crear`.** Los datos de prueba se generan para el
día y la hora en que se ejecuta ese comando: la agenda es la de hoy, y la dosis de
medicación del paso 9 solo se puede administrar durante los 30 minutos siguientes.

### Paso 1 — Seguridad (IAM)

1. Entrar con una contraseña incorrecta → "Usuario o contraseña incorrectos."
2. Entrar como `recepcion` → el menú muestra solo lo que ese rol puede usar.
3. Escribir en la barra de direcciones `/iam/usuarios` → el sistema lo devuelve a su pantalla.

### Paso 2 — Reserva de turno (Admisión HU 1.1)

Como `recepcion`, en **Turnos y agenda**:

1. En "Paciente para operar" elegir **López, Carlos**.
2. Pulsar **Reservar** en el turno de las **10:00**.
3. ✔ El turno queda **Programado** a nombre de Carlos López.

### Paso 3 — Entreturno (Admisión HU 1.2)

1. Elegir como paciente a **Medina, Luis**.
2. En "Insertar entreturno" poner **10:15** e insertar.
3. ✔ El turno de las 10:00 pasa a 15 minutos con la etiqueta **Tiempo reducido**; aparece
   uno nuevo de 10:15 a 10:30 con la etiqueta **Entreturno**; el de las 10:30 no cambia.

### Paso 4 — Lista de espera (Admisión HU 1.3)

1. Elegir a **Gómez, Laura** y **reservar** el turno de las **11:00**.
2. Elegir a **Rojas, Ana** y pulsar **Agregar al paciente seleccionado** en "Lista de espera".
3. Pulsar **Cancelar** en el turno de las 11:00.
4. ✔ El turno de Laura queda **Cancelado**; aparece uno nuevo a las 11:00, **Programado**
   para Ana Rojas; la lista de espera queda vacía; arriba aparece el aviso para recepción.

### Paso 5 — Estados del turno (Admisión HU 2.1)

En la segunda ventana entrar como `dsilva` (médico).

1. Recepción: en el turno de las **09:00** (Juan Gómez, Confirmado) pulsar **Registrar llegada**.
2. ✔ Pasa a **En Sala de Espera**. Al médico le llega la notificación y su agenda se
   actualiza sola.
3. ✔ El turno cancelado del paso 4 no ofrece ninguna acción.
4. Médico: pulsar **Marcar atendido** en el turno de Juan Gómez. (Genera una factura
   automática; se ve en el paso 10.)

### Paso 6 — Triaje de guardia (Admisión HU 3.1)

Ventana 1: `mtorres` (enfermero) → **Guardia**. Ventana 2: `dsilva` → **Guardia**.

1. Enfermero: ingresar a **Medina, Luis**, nivel **4 - Verde**, motivo "Esguince".
2. Ingresar a **Gómez, Laura**, nivel **1 - Rojo**, motivo "Dolor de pecho".
3. ✔ Laura queda en la **posición 1**, por encima de Luis. Al médico le aparece al instante
   el cartel rojo **CÓDIGO ROJO en guardia**.

### Paso 7 — Asignación de cama y protocolo (Recursos HU 1.1 · Enfermería HU 2.1)

Ventana 1: `recepcion` → **Mapa de camas**. Ventana 2: `mtorres` → **Protocolos de atención**.

1. En la **Cama 101** pulsar **Asignar paciente** → **Gómez, Laura**, motivo
   **Cirugía programada**. Confirmar.
2. ✔ La cama pasa a **Ocupada**. Al enfermero le aparece solo el protocolo
   "Ingreso Pre-Quirúrgico" con tres tareas.
3. Repetir en la **Cama 103** con **Medina, Luis**, motivo **Infección respiratoria**.
4. ✔ Aparece el protocolo "Ingreso por Infección Respiratoria", con otras tareas.

### Paso 8 — Alta y limpieza (Recursos HU 2.1)

Ventana 1: `dsilva` → **Mapa de camas**. Ventana 2: `mtorres` → **Mapa de camas**.

1. Médico: **Dar de alta** en la cama 103.
2. ✔ La cama pasa a **En limpieza** en las dos ventanas y no se puede asignar.
3. Enfermero: **Confirmar limpieza**.
4. ✔ La cama vuelve a **Libre** en las dos ventanas.

### Paso 9 — Signos vitales y medicación (Enfermería HU 1.1 y 1.2 · Recursos HU 3.1 · Facturación HU 2.1)

Como `mtorres`:

1. **Signos vitales** → elegir **López, Carlos — Hab. 204** → cargar 120 / 80 / 72 / 36.5.
   ✔ Mensaje verde y nota automática.
2. Cargar 125 / 82 / 96 / **39.5**. ✔ La fila queda en rojo y al médico le llega la alerta.
3. **Insumos** → Ibuprofeno 400mg tiene **50** unidades.
4. **Medicación** → **Marcar administrada** en la primera dosis de Ana Rojas.
   ✔ Queda Administrada con el nombre del enfermero. En **Insumos** el stock es **49**.
5. Pulsar **Marcar administrada** en la segunda dosis. ✔ Error: fuera del margen permitido.

Como `admin`:

6. **Movimientos de inventario** → hay un EGRESO de 1 unidad con un ID de evento.
7. **Cargos (ítems)** → hay una línea "Insumos de Farmacia" con el mismo ID de evento.

### Paso 10 — Facturación (Facturación HU 1.1)

Como `admin`, en **Facturas** → "Facturar una prestación":

| Paciente | Resultado esperado |
|---|---|
| Gómez, Juan (obra social pública) | Paciente $ 0 · Estado $ 15.000 |
| Rojas, Ana (prepaga) | Paciente $ 3.000 · Prepaga $ 12.000 |
| López, Carlos (sin cobertura) | Paciente $ 15.000 |

✔ En la lista de facturas está también la que se generó sola en el paso 5.
✔ **Reportes** muestra los totales por pagador y por concepto.

### Paso 11 — Historia clínica y usuarios

- Como `dsilva`: **Pacientes** → "Historia clínica" de Carlos López. Agregar una evolución.
  ✔ No se puede editar ni borrar.
- Como `admin`: **Usuarios y roles** → crear un usuario, cambiarle el rol, desactivarlo.
- Como `clopez`: **Mis turnos**.

## 7. Pruebas automáticas

```bash
cd backend
npm test              # pruebas unitarias (no necesitan nada más)
```

Para las pruebas de punta a punta, con el backend corriendo en otra terminal:

```bash
npm run db:crear
npm run test:e2e
npm run db:crear      # deja la base limpia otra vez
```

Las dos deben terminar con `Tests 23 passed (23)`.

## 8. Mirar la base de datos

En SSMS, sobre `HospitalDB`:

```sql
SELECT codigo, estado, version FROM camas;
SELECT nombre, stock FROM insumos;
SELECT TOP 5 * FROM facturas_items ORDER BY id DESC;
```

Las columnas de fecha y hora se guardan en UTC: se ven 3 horas adelantadas respecto de
Argentina. La aplicación las muestra en hora local.
