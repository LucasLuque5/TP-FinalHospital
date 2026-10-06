/* =====================================================================
   HOSPITAL INFORMATION SYSTEM - Script DDL para SQL Server
   ---------------------------------------------------------------------
   Crea la base de datos "HospitalDB" y todas sus tablas.
   Se puede ejecutar todas las veces que haga falta: primero borra las
   tablas (si existen) y después las vuelve a crear vacías.

   FECHAS: todas las columnas de fecha y hora (DATETIME2) guardan la hora
   en UTC. Por eso los valores por defecto usan SYSUTCDATETIME(). Al
   mirarlas en SSMS se ven 3 horas adelantadas respecto de Argentina;
   la aplicación las muestra en hora local.

   Cómo ejecutarlo:
     Opción A (recomendada):  cd backend  &&  npm run db:crear
     Opción B (SSMS):         abrir este archivo y presionar F5
     Opción C (sqlcmd):       sqlcmd -S ".\SQLEXPRESS" -E -i "01-crear-base-de-datos.sql"
   ===================================================================== */

IF DB_ID('HospitalDB') IS NULL
    CREATE DATABASE HospitalDB;
GO

USE HospitalDB;
GO

/* ---------------------------------------------------------------------
   1) BORRADO: se borran primero las tablas "hijas" (las que tienen
      claves foráneas) y al final las "padres".
   --------------------------------------------------------------------- */
DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS facturas_items;
DROP TABLE IF EXISTS facturas;
DROP TABLE IF EXISTS precios_insumos;
DROP TABLE IF EXISTS prestaciones;
DROP TABLE IF EXISTS coberturas_pacientes;
DROP TABLE IF EXISTS obras_sociales;
DROP TABLE IF EXISTS protocolos_tareas;
DROP TABLE IF EXISTS protocolos;
DROP TABLE IF EXISTS administraciones_medicacion;
DROP TABLE IF EXISTS indicaciones_medicas;
DROP TABLE IF EXISTS notas_enfermeria;
DROP TABLE IF EXISTS signos_vitales;
DROP TABLE IF EXISTS movimientos_inventarios;
DROP TABLE IF EXISTS insumos;
DROP TABLE IF EXISTS camas_historial;
DROP TABLE IF EXISTS camas;
DROP TABLE IF EXISTS habitaciones;
DROP TABLE IF EXISTS triajes;
DROP TABLE IF EXISTS lista_espera;
DROP TABLE IF EXISTS turnos;
DROP TABLE IF EXISTS estudios;
DROP TABLE IF EXISTS evoluciones_medicas;
DROP TABLE IF EXISTS antecedentes_familiares;
DROP TABLE IF EXISTS alergias;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS pacientes;
DROP TABLE IF EXISTS roles;
GO

/* =====================================================================
   MÓDULO 3 - HISTORIA CLÍNICA ELECTRÓNICA (HCE)
   (se crea antes que IAM porque "usuarios" puede apuntar a un paciente)
   ===================================================================== */

-- Ficha demográfica del paciente
CREATE TABLE pacientes (
    id               INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_pacientes PRIMARY KEY,
    dni              VARCHAR(15)   NOT NULL CONSTRAINT UQ_pacientes_dni UNIQUE,
    nombre           NVARCHAR(80)  NOT NULL,
    apellido         NVARCHAR(80)  NOT NULL,
    fecha_nacimiento DATE          NOT NULL,
    sexo             CHAR(1)       NULL CONSTRAINT CK_pacientes_sexo CHECK (sexo IN ('F','M','X')),
    telefono         VARCHAR(30)   NULL,
    email            VARCHAR(120)  NULL,
    direccion        NVARCHAR(150) NULL,
    creado_en        DATETIME2(0)  NOT NULL CONSTRAINT DF_pacientes_creado DEFAULT SYSUTCDATETIME()
);

/* =====================================================================
   MÓDULO 1 - IDENTIDAD Y ACCESOS (IAM)
   ===================================================================== */

CREATE TABLE roles (
    id     INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_roles PRIMARY KEY,
    nombre NVARCHAR(30) NOT NULL CONSTRAINT UQ_roles_nombre UNIQUE
);

CREATE TABLE usuarios (
    id             INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_usuarios PRIMARY KEY,
    nombre_usuario VARCHAR(50)   NOT NULL CONSTRAINT UQ_usuarios_nombre_usuario UNIQUE,
    password_hash  VARCHAR(100)  NOT NULL,          -- nunca se guarda la contraseña, solo su hash (bcrypt)
    nombre         NVARCHAR(80)  NOT NULL,
    apellido       NVARCHAR(80)  NOT NULL,
    rol_id         INT           NOT NULL CONSTRAINT FK_usuarios_roles REFERENCES roles(id),
    paciente_id    INT           NULL     CONSTRAINT FK_usuarios_pacientes REFERENCES pacientes(id), -- solo para el rol Paciente
    activo         BIT           NOT NULL CONSTRAINT DF_usuarios_activo DEFAULT 1,
    creado_en      DATETIME2(0)  NOT NULL CONSTRAINT DF_usuarios_creado DEFAULT SYSUTCDATETIME()
);

/* ----- resto de HCE ----- */

CREATE TABLE alergias (
    id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_alergias PRIMARY KEY,
    paciente_id   INT           NOT NULL CONSTRAINT FK_alergias_pacientes REFERENCES pacientes(id),
    sustancia     NVARCHAR(100) NOT NULL,
    severidad     NVARCHAR(10)  NOT NULL CONSTRAINT CK_alergias_severidad CHECK (severidad IN ('Leve','Moderada','Grave')),
    observaciones NVARCHAR(300) NULL,
    registrado_en DATETIME2(0)  NOT NULL CONSTRAINT DF_alergias_registrado DEFAULT SYSUTCDATETIME()
);

CREATE TABLE antecedentes_familiares (
    id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_antecedentes_familiares PRIMARY KEY,
    paciente_id   INT           NOT NULL CONSTRAINT FK_antecedentes_pacientes REFERENCES pacientes(id),
    parentesco    NVARCHAR(50)  NOT NULL,
    enfermedad    NVARCHAR(150) NOT NULL,
    observaciones NVARCHAR(300) NULL,
    registrado_en DATETIME2(0)  NOT NULL CONSTRAINT DF_antecedentes_registrado DEFAULT SYSUTCDATETIME()
);

-- Evoluciones médicas: son INMUTABLES (la aplicación solo permite INSERT y SELECT)
CREATE TABLE evoluciones_medicas (
    id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_evoluciones_medicas PRIMARY KEY,
    paciente_id   INT           NOT NULL CONSTRAINT FK_evoluciones_pacientes REFERENCES pacientes(id),
    medico_id     INT           NOT NULL CONSTRAINT FK_evoluciones_usuarios REFERENCES usuarios(id),
    descripcion   NVARCHAR(MAX) NOT NULL,
    registrado_en DATETIME2(0)  NOT NULL CONSTRAINT DF_evoluciones_registrado DEFAULT SYSUTCDATETIME()
);

CREATE TABLE estudios (
    id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_estudios PRIMARY KEY,
    paciente_id INT           NOT NULL CONSTRAINT FK_estudios_pacientes REFERENCES pacientes(id),
    tipo        NVARCHAR(100) NOT NULL,
    fecha       DATE          NOT NULL,
    informe     NVARCHAR(MAX) NOT NULL
);

/* =====================================================================
   MÓDULO 2 - ADMISIÓN Y TURNOS
   ===================================================================== */

CREATE TABLE turnos (
    id                INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_turnos PRIMARY KEY,
    medico_id         INT          NOT NULL CONSTRAINT FK_turnos_medicos REFERENCES usuarios(id),
    paciente_id       INT          NULL     CONSTRAINT FK_turnos_pacientes REFERENCES pacientes(id),
    fecha_hora_inicio DATETIME2(0) NOT NULL,
    duracion_minutos  INT          NOT NULL CONSTRAINT CK_turnos_duracion CHECK (duracion_minutos > 0),
    estado            NVARCHAR(20) NOT NULL CONSTRAINT DF_turnos_estado DEFAULT 'Disponible'
                      CONSTRAINT CK_turnos_estado CHECK (estado IN
                      ('Disponible','Programado','Confirmado','En Sala de Espera','Atendido','Cancelado')),
    es_entreturno     BIT          NOT NULL CONSTRAINT DF_turnos_entreturno DEFAULT 0,
    tiempo_reducido   BIT          NOT NULL CONSTRAINT DF_turnos_reducido DEFAULT 0, -- etiqueta visual (HU 1.2)
    creado_en         DATETIME2(0) NOT NULL CONSTRAINT DF_turnos_creado DEFAULT SYSUTCDATETIME(),
    -- Un turno Disponible no tiene paciente; cualquier otro estado sí.
    CONSTRAINT CK_turnos_paciente CHECK (
        (estado = 'Disponible' AND paciente_id IS NULL) OR
        (estado <> 'Disponible' AND paciente_id IS NOT NULL))
);

-- Índice único FILTRADO: un médico no puede tener dos turnos "vivos" a la misma hora.
-- Los cancelados quedan afuera porque se conservan como historial.
CREATE UNIQUE INDEX UX_turnos_medico_horario
    ON turnos (medico_id, fecha_hora_inicio)
    WHERE estado <> 'Cancelado';

-- Lista de espera / standby (HU 1.3). Es una cola: sale primero el que entró primero.
CREATE TABLE lista_espera (
    id                INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_lista_espera PRIMARY KEY,
    medico_id         INT          NOT NULL CONSTRAINT FK_lista_espera_medicos REFERENCES usuarios(id),
    paciente_id       INT          NOT NULL CONSTRAINT FK_lista_espera_pacientes REFERENCES pacientes(id),
    fecha             DATE         NOT NULL,
    estado            NVARCHAR(15) NOT NULL CONSTRAINT DF_lista_espera_estado DEFAULT 'En espera'
                      CONSTRAINT CK_lista_espera_estado CHECK (estado IN ('En espera','Asignado')),
    turno_asignado_id INT          NULL CONSTRAINT FK_lista_espera_turnos REFERENCES turnos(id),
    creado_en         DATETIME2(3) NOT NULL CONSTRAINT DF_lista_espera_creado DEFAULT SYSUTCDATETIME()
);

-- Cola de guardia (HU 3.1). nivel 1 = Rojo (Riesgo Vital) ... 5 = Azul (No urgente)
CREATE TABLE triajes (
    id           INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_triajes PRIMARY KEY,
    paciente_id  INT           NOT NULL CONSTRAINT FK_triajes_pacientes REFERENCES pacientes(id),
    enfermero_id INT           NOT NULL CONSTRAINT FK_triajes_usuarios REFERENCES usuarios(id),
    nivel        TINYINT       NOT NULL CONSTRAINT CK_triajes_nivel CHECK (nivel BETWEEN 1 AND 5),
    motivo       NVARCHAR(300) NOT NULL,
    estado       NVARCHAR(15)  NOT NULL CONSTRAINT DF_triajes_estado DEFAULT 'En espera'
                 CONSTRAINT CK_triajes_estado CHECK (estado IN ('En espera','Atendido')),
    ingreso_en   DATETIME2(3)  NOT NULL CONSTRAINT DF_triajes_ingreso DEFAULT SYSUTCDATETIME(),
    atendido_en  DATETIME2(0)  NULL
);

/* =====================================================================
   MÓDULO 5 - GESTIÓN DE RECURSOS Y CAMAS
   ===================================================================== */

CREATE TABLE habitaciones (
    id     INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_habitaciones PRIMARY KEY,
    numero VARCHAR(10)  NOT NULL CONSTRAINT UQ_habitaciones_numero UNIQUE,
    piso   INT          NOT NULL,
    sector NVARCHAR(60) NOT NULL
);

CREATE TABLE camas (
    id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_camas PRIMARY KEY,
    habitacion_id INT          NOT NULL CONSTRAINT FK_camas_habitaciones REFERENCES habitaciones(id),
    codigo        VARCHAR(10)  NOT NULL CONSTRAINT UQ_camas_codigo UNIQUE,
    estado        NVARCHAR(15) NOT NULL CONSTRAINT DF_camas_estado DEFAULT 'Libre'
                  CONSTRAINT CK_camas_estado CHECK (estado IN ('Libre','Ocupada','En limpieza','Bloqueada')),
    -- "version" se usa para el BLOQUEO OPTIMISTA: cada cambio le suma 1.
    version       INT          NOT NULL CONSTRAINT DF_camas_version DEFAULT 1
);

-- Historial de camas = internaciones. Relaciona ID Paciente + ID Cama + marca temporal de ingreso.
CREATE TABLE camas_historial (
    id                  INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_camas_historial PRIMARY KEY,
    cama_id             INT           NOT NULL CONSTRAINT FK_camas_historial_camas REFERENCES camas(id),
    paciente_id         INT           NOT NULL CONSTRAINT FK_camas_historial_pacientes REFERENCES pacientes(id),
    motivo_ingreso      NVARCHAR(30)  NOT NULL CONSTRAINT CK_camas_historial_motivo
                        CHECK (motivo_ingreso IN ('PRE_QUIRURGICO','INFECCION_RESPIRATORIA','OTRO')),
    diagnostico_inicial NVARCHAR(200) NULL,
    fecha_ingreso       DATETIME2(0)  NOT NULL CONSTRAINT DF_camas_historial_ingreso DEFAULT SYSUTCDATETIME(),
    fecha_egreso        DATETIME2(0)  NULL   -- NULL = el paciente sigue internado
);

-- Red de seguridad en la base: una cama no puede tener dos internaciones abiertas,
-- y un paciente no puede estar internado en dos camas a la vez.
CREATE UNIQUE INDEX UX_camas_historial_cama_activa
    ON camas_historial (cama_id) WHERE fecha_egreso IS NULL;
CREATE UNIQUE INDEX UX_camas_historial_paciente_activo
    ON camas_historial (paciente_id) WHERE fecha_egreso IS NULL;

CREATE TABLE insumos (
    id     INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_insumos PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL CONSTRAINT UQ_insumos_nombre UNIQUE,
    -- El CHECK impide que el stock quede negativo aunque el programa tuviera un error.
    stock  INT           NOT NULL CONSTRAINT CK_insumos_stock CHECK (stock >= 0)
);

CREATE TABLE movimientos_inventarios (
    id         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_movimientos_inventarios PRIMARY KEY,
    insumo_id  INT              NOT NULL CONSTRAINT FK_movimientos_insumos REFERENCES insumos(id),
    tipo       NVARCHAR(10)     NOT NULL CONSTRAINT CK_movimientos_tipo CHECK (tipo IN ('INGRESO','EGRESO')),
    cantidad   INT              NOT NULL CONSTRAINT CK_movimientos_cantidad CHECK (cantidad > 0),
    motivo     NVARCHAR(200)    NOT NULL,
    evento_id  UNIQUEIDENTIFIER NULL,   -- ID del evento que originó el movimiento (trazabilidad)
    usuario_id INT              NULL CONSTRAINT FK_movimientos_usuarios REFERENCES usuarios(id),
    fecha      DATETIME2(0)     NOT NULL CONSTRAINT DF_movimientos_fecha DEFAULT SYSUTCDATETIME()
);

/* =====================================================================
   MÓDULO 4 - ATENCIÓN Y ENFERMERÍA
   ===================================================================== */

CREATE TABLE signos_vitales (
    id                 INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_signos_vitales PRIMARY KEY,
    internacion_id     INT          NOT NULL CONSTRAINT FK_signos_internaciones REFERENCES camas_historial(id),
    paciente_id        INT          NOT NULL CONSTRAINT FK_signos_pacientes REFERENCES pacientes(id),
    enfermero_id       INT          NOT NULL CONSTRAINT FK_signos_usuarios REFERENCES usuarios(id),
    presion_sistolica  INT          NOT NULL,
    presion_diastolica INT          NOT NULL,
    frecuencia_cardiaca INT         NOT NULL,
    temperatura        DECIMAL(4,1) NOT NULL,
    fuera_de_rango     BIT          NOT NULL CONSTRAINT DF_signos_fuera DEFAULT 0, -- se muestra en rojo
    registrado_en      DATETIME2(0) NOT NULL CONSTRAINT DF_signos_registrado DEFAULT SYSUTCDATETIME()
);

CREATE TABLE notas_enfermeria (
    id           INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_notas_enfermeria PRIMARY KEY,
    paciente_id  INT           NOT NULL CONSTRAINT FK_notas_pacientes REFERENCES pacientes(id),
    enfermero_id INT           NOT NULL CONSTRAINT FK_notas_usuarios REFERENCES usuarios(id),
    texto        NVARCHAR(500) NOT NULL,
    automatica   BIT           NOT NULL CONSTRAINT DF_notas_automatica DEFAULT 0,
    creado_en    DATETIME2(0)  NOT NULL CONSTRAINT DF_notas_creado DEFAULT SYSUTCDATETIME()
);

-- Indicación del médico: "Ibuprofeno 400mg cada 8 horas"
CREATE TABLE indicaciones_medicas (
    id               INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_indicaciones_medicas PRIMARY KEY,
    paciente_id      INT           NOT NULL CONSTRAINT FK_indicaciones_pacientes REFERENCES pacientes(id),
    medico_id        INT           NOT NULL CONSTRAINT FK_indicaciones_usuarios REFERENCES usuarios(id),
    insumo_id        INT           NOT NULL CONSTRAINT FK_indicaciones_insumos REFERENCES insumos(id),
    descripcion      NVARCHAR(200) NOT NULL,
    frecuencia_horas INT           NOT NULL CONSTRAINT CK_indicaciones_frecuencia CHECK (frecuencia_horas > 0),
    activa           BIT           NOT NULL CONSTRAINT DF_indicaciones_activa DEFAULT 1,
    creado_en        DATETIME2(0)  NOT NULL CONSTRAINT DF_indicaciones_creado DEFAULT SYSUTCDATETIME()
);

-- Cada dosis programada de una indicación
CREATE TABLE administraciones_medicacion (
    id              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_administraciones_medicacion PRIMARY KEY,
    indicacion_id   INT              NOT NULL CONSTRAINT FK_administraciones_indicaciones REFERENCES indicaciones_medicas(id),
    hora_programada DATETIME2(0)     NOT NULL,
    estado          NVARCHAR(15)     NOT NULL CONSTRAINT DF_administraciones_estado DEFAULT 'Pendiente'
                    CONSTRAINT CK_administraciones_estado CHECK (estado IN ('Pendiente','Administrada')),
    administrada_en DATETIME2(0)     NULL,
    enfermero_id    INT              NULL CONSTRAINT FK_administraciones_usuarios REFERENCES usuarios(id),
    evento_id       UNIQUEIDENTIFIER NULL  -- ID del evento "MedicacionAdministrada" que se publicó
);

-- Protocolo de atención generado con el patrón Builder (HU 2.1 de Enfermería)
CREATE TABLE protocolos (
    id             INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_protocolos PRIMARY KEY,
    internacion_id INT           NOT NULL CONSTRAINT FK_protocolos_internaciones REFERENCES camas_historial(id),
    paciente_id    INT           NOT NULL CONSTRAINT FK_protocolos_pacientes REFERENCES pacientes(id),
    nombre         NVARCHAR(100) NOT NULL,
    creado_en      DATETIME2(0)  NOT NULL CONSTRAINT DF_protocolos_creado DEFAULT SYSUTCDATETIME()
);

CREATE TABLE protocolos_tareas (
    id             INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_protocolos_tareas PRIMARY KEY,
    protocolo_id   INT           NOT NULL CONSTRAINT FK_tareas_protocolos REFERENCES protocolos(id),
    orden          INT           NOT NULL,
    descripcion    NVARCHAR(200) NOT NULL,
    completada     BIT           NOT NULL CONSTRAINT DF_tareas_completada DEFAULT 0,
    completada_por INT           NULL CONSTRAINT FK_tareas_usuarios REFERENCES usuarios(id),
    completada_en  DATETIME2(0)  NULL
);

/* =====================================================================
   MÓDULO 6 - FACTURACIÓN Y ADMINISTRACIÓN
   ===================================================================== */

-- Un paciente SIN fila en coberturas_pacientes es "Particular".
CREATE TABLE obras_sociales (
    id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_obras_sociales PRIMARY KEY,
    nombre      NVARCHAR(100) NOT NULL CONSTRAINT UQ_obras_sociales_nombre UNIQUE,
    tipo        NVARCHAR(10)  NOT NULL CONSTRAINT CK_obras_sociales_tipo CHECK (tipo IN ('PUBLICA','PREPAGA')),
    copago_fijo DECIMAL(12,2) NOT NULL CONSTRAINT DF_obras_sociales_copago DEFAULT 0
);

CREATE TABLE coberturas_pacientes (
    id              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_coberturas_pacientes PRIMARY KEY,
    paciente_id     INT         NOT NULL CONSTRAINT FK_coberturas_pacientes REFERENCES pacientes(id),
    obra_social_id  INT         NOT NULL CONSTRAINT FK_coberturas_obras_sociales REFERENCES obras_sociales(id),
    numero_afiliado VARCHAR(30) NOT NULL,
    vigente         BIT         NOT NULL CONSTRAINT DF_coberturas_vigente DEFAULT 1
);

-- Un paciente solo puede tener UNA cobertura vigente
CREATE UNIQUE INDEX UX_coberturas_paciente_vigente
    ON coberturas_pacientes (paciente_id) WHERE vigente = 1;

-- Nomenclador: lista de prestaciones con su valor base
CREATE TABLE prestaciones (
    id         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_prestaciones PRIMARY KEY,
    codigo     VARCHAR(20)   NOT NULL CONSTRAINT UQ_prestaciones_codigo UNIQUE,
    nombre     NVARCHAR(100) NOT NULL,
    valor_base DECIMAL(12,2) NOT NULL CONSTRAINT CK_prestaciones_valor CHECK (valor_base >= 0)
);

-- Lista de precios de insumos. vigente_hasta NULL = precio vigente hoy
CREATE TABLE precios_insumos (
    id              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_precios_insumos PRIMARY KEY,
    insumo_id       INT           NOT NULL CONSTRAINT FK_precios_insumos REFERENCES insumos(id),
    precio_unitario DECIMAL(12,2) NOT NULL CONSTRAINT CK_precios_precio CHECK (precio_unitario >= 0),
    vigente_desde   DATE          NOT NULL,
    vigente_hasta   DATE          NULL
);

-- tipo PRESTACION = una atención puntual (ej. consulta). tipo ESTADIA = cuenta de gastos de una internación.
CREATE TABLE facturas (
    id             INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_facturas PRIMARY KEY,
    paciente_id    INT          NOT NULL CONSTRAINT FK_facturas_pacientes REFERENCES pacientes(id),
    internacion_id INT          NULL CONSTRAINT FK_facturas_internaciones REFERENCES camas_historial(id),
    tipo           NVARCHAR(12) NOT NULL CONSTRAINT CK_facturas_tipo CHECK (tipo IN ('PRESTACION','ESTADIA')),
    estado         NVARCHAR(10) NOT NULL CONSTRAINT DF_facturas_estado DEFAULT 'Abierta'
                   CONSTRAINT CK_facturas_estado CHECK (estado IN ('Abierta','Cerrada')),
    creado_en      DATETIME2(0) NOT NULL CONSTRAINT DF_facturas_creado DEFAULT SYSUTCDATETIME(),
    cerrada_en     DATETIME2(0) NULL
);

CREATE TABLE facturas_items (
    id              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_facturas_items PRIMARY KEY,
    factura_id      INT              NOT NULL CONSTRAINT FK_items_facturas REFERENCES facturas(id),
    concepto        NVARCHAR(60)     NOT NULL,   -- ej. "Insumos de Farmacia"
    descripcion     NVARCHAR(200)    NOT NULL,
    cantidad        INT              NOT NULL CONSTRAINT DF_items_cantidad DEFAULT 1,
    precio_unitario DECIMAL(12,2)    NOT NULL,
    importe         DECIMAL(12,2)    NOT NULL,
    -- Quién paga esta línea: el paciente, la prepaga (reclamo a terceros) o el Estado (subsidio)
    a_cargo_de      NVARCHAR(10)     NOT NULL CONSTRAINT CK_items_a_cargo CHECK (a_cargo_de IN ('PACIENTE','PREPAGA','ESTADO')),
    obra_social_id  INT              NULL CONSTRAINT FK_items_obras_sociales REFERENCES obras_sociales(id),
    evento_id       UNIQUEIDENTIFIER NULL,       -- ID del evento original (auditoría, HU 2.1)
    creado_en       DATETIME2(0)     NOT NULL CONSTRAINT DF_items_creado DEFAULT SYSUTCDATETIME()
);

-- El mismo evento no puede generar dos cargos (si el evento llegara repetido, se rechaza)
CREATE UNIQUE INDEX UX_facturas_items_evento
    ON facturas_items (evento_id) WHERE evento_id IS NOT NULL;

/* =====================================================================
   COMPONENTE COMPARTIDO - NOTIFICACIONES (alertas a monitores)
   ===================================================================== */

CREATE TABLE notificaciones (
    id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_notificaciones PRIMARY KEY,
    rol_destino NVARCHAR(30)  NOT NULL,   -- nombre del rol que debe verla
    usuario_destino_id INT    NULL CONSTRAINT FK_notificaciones_usuarios REFERENCES usuarios(id), -- si se completa, solo la ve ese usuario
    prioridad   NVARCHAR(10)  NOT NULL CONSTRAINT CK_notificaciones_prioridad CHECK (prioridad IN ('NORMAL','ALTA')),
    titulo      NVARCHAR(100) NOT NULL,
    mensaje     NVARCHAR(400) NOT NULL,
    creado_en   DATETIME2(0)  NOT NULL CONSTRAINT DF_notificaciones_creado DEFAULT SYSUTCDATETIME()
);
GO

PRINT 'Tablas creadas correctamente en HospitalDB.';
GO
