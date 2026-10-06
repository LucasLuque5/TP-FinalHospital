/* =====================================================================
   HOSPITAL INFORMATION SYSTEM - Datos iniciales (seed)
   ---------------------------------------------------------------------
   Carga los datos mínimos para poder probar todas las historias de
   usuario. Usa los mismos nombres que aparecen en las consignas
   (Dr. Silva, Carlos López, Cama 101, Ibuprofeno 400mg, etc.).

   Ejecutar DESPUÉS de 01-crear-base-de-datos.sql (npm run db:crear
   ejecuta los dos en orden).

   USUARIOS DE PRUEBA  (todos con la contraseña:  Hospital123 )
     admin      -> Administrador
     dsilva     -> Médico         (Dr. Roberto Silva)
     mtorres    -> Enfermero      (Martín Torres)
     recepcion  -> Recepcionista  (Paula Díaz)
     clopez     -> Paciente       (Carlos López)
   ===================================================================== */

USE HospitalDB;
GO

/* ---------- IAM: roles ---------- */
INSERT INTO roles (nombre) VALUES
    (N'Administrador'), (N'Médico'), (N'Enfermero'), (N'Recepcionista'), (N'Paciente');

/* ---------- HCE: pacientes ---------- */
INSERT INTO pacientes (dni, nombre, apellido, fecha_nacimiento, sexo, telefono, email, direccion) VALUES
    ('30111222', N'Carlos', N'López',  '1985-03-14', 'M', '351-5550101', 'carlos.lopez@correo.test', N'Av. Colón 1234'),
    ('28444555', N'Luis',   N'Medina', '1979-11-02', 'M', '351-5550102', 'luis.medina@correo.test',  N'Bv. San Juan 456'),
    ('33777888', N'Juan',   N'Gómez',  '1990-07-21', 'M', '351-5550103', 'juan.gomez@correo.test',   N'Caseros 789'),
    ('35999000', N'Ana',    N'Rojas',  '1994-01-30', 'F', '351-5550104', 'ana.rojas@correo.test',    N'Duarte Quirós 321'),
    ('31222333', N'Laura',  N'Gómez',  '1988-09-09', 'F', '351-5550105', 'laura.gomez@correo.test',  N'27 de Abril 654');

DECLARE @carlos INT = (SELECT id FROM pacientes WHERE dni = '30111222');
DECLARE @luis   INT = (SELECT id FROM pacientes WHERE dni = '28444555');
DECLARE @juan   INT = (SELECT id FROM pacientes WHERE dni = '33777888');
DECLARE @ana    INT = (SELECT id FROM pacientes WHERE dni = '35999000');

/* ---------- IAM: usuarios ----------
   El hash corresponde a la contraseña "Hospital123" (bcrypt, 10 rondas). */
DECLARE @hash VARCHAR(100) = '$2b$10$zYbNfZb8WuOJcPf5kKVU6eWb0uXPc9iBHXxthp8beQCo8/fk3AjOO';

INSERT INTO usuarios (nombre_usuario, password_hash, nombre, apellido, rol_id, paciente_id) VALUES
    ('admin',     @hash, N'Admin',   N'General', (SELECT id FROM roles WHERE nombre = N'Administrador'), NULL),
    ('dsilva',    @hash, N'Roberto', N'Silva',   (SELECT id FROM roles WHERE nombre = N'Médico'),        NULL),
    ('mtorres',   @hash, N'Martín',  N'Torres',  (SELECT id FROM roles WHERE nombre = N'Enfermero'),     NULL),
    ('recepcion', @hash, N'Paula',   N'Díaz',    (SELECT id FROM roles WHERE nombre = N'Recepcionista'), NULL),
    ('clopez',    @hash, N'Carlos',  N'López',   (SELECT id FROM roles WHERE nombre = N'Paciente'),      @carlos);

DECLARE @silva  INT = (SELECT id FROM usuarios WHERE nombre_usuario = 'dsilva');

/* ---------- HCE: historia clínica de ejemplo (Carlos López) ---------- */
INSERT INTO alergias (paciente_id, sustancia, severidad, observaciones) VALUES
    (@carlos, N'Penicilina', 'Grave', N'Reacción anafiláctica en 2015');

INSERT INTO antecedentes_familiares (paciente_id, parentesco, enfermedad, observaciones) VALUES
    (@carlos, N'Padre', N'Hipertensión arterial', NULL),
    (@carlos, N'Madre', N'Diabetes tipo 2', N'Diagnosticada a los 50 años');

INSERT INTO evoluciones_medicas (paciente_id, medico_id, descripcion) VALUES
    (@carlos, @silva, N'Paciente ingresa para observación. Lúcido, hemodinámicamente estable.');

INSERT INTO estudios (paciente_id, tipo, fecha, informe) VALUES
    (@carlos, N'Radiografía de tórax', CAST(GETDATE() AS DATE), N'Campos pulmonares sin infiltrados. Silueta cardíaca normal.'),
    (@carlos, N'Hemograma completo',   CAST(GETDATE() AS DATE), N'Hematocrito 42%. Glóbulos blancos 7.200/mm3. Plaquetas normales.');

/* ---------- ADMISIÓN: agenda de HOY del Dr. Silva ----------
   Turnos de 30 minutos de 09:00 a 12:30.
   El de las 09:00 ya está "Confirmado" para Juan Gómez (HU 2.1); el resto está Disponible. */
-- IMPORTANTE: todas las fechas con hora se guardan en UTC (hora universal).
-- @difUtc = minutos que hay que sumarle a la hora local para obtener UTC (en Argentina, 180).
DECLARE @difUtc INT = DATEDIFF(MINUTE, GETDATE(), GETUTCDATE());
-- @hoy = las 00:00 de hoy (hora local), expresadas en UTC.
DECLARE @hoy DATETIME2(0) = DATEADD(MINUTE, @difUtc, CAST(CAST(GETDATE() AS DATE) AS DATETIME2(0)));

INSERT INTO turnos (medico_id, paciente_id, fecha_hora_inicio, duracion_minutos, estado) VALUES
    (@silva, @juan, DATEADD(MINUTE,  540, @hoy), 30, 'Confirmado'),   -- 09:00
    (@silva, NULL,  DATEADD(MINUTE,  570, @hoy), 30, 'Disponible'),   -- 09:30
    (@silva, NULL,  DATEADD(MINUTE,  600, @hoy), 30, 'Disponible'),   -- 10:00
    (@silva, NULL,  DATEADD(MINUTE,  630, @hoy), 30, 'Disponible'),   -- 10:30
    (@silva, NULL,  DATEADD(MINUTE,  660, @hoy), 30, 'Disponible'),   -- 11:00
    (@silva, NULL,  DATEADD(MINUTE,  690, @hoy), 30, 'Disponible'),   -- 11:30
    (@silva, NULL,  DATEADD(MINUTE,  720, @hoy), 30, 'Disponible'),   -- 12:00
    (@silva, NULL,  DATEADD(MINUTE,  750, @hoy), 30, 'Disponible');   -- 12:30

/* ---------- RECURSOS: habitaciones y camas ---------- */
INSERT INTO habitaciones (numero, piso, sector) VALUES
    ('101', 1, N'Clínica Médica'),
    ('102', 1, N'Clínica Médica'),
    ('204', 2, N'Internación General'),
    ('205', 2, N'Internación General');

INSERT INTO camas (habitacion_id, codigo, estado) VALUES
    ((SELECT id FROM habitaciones WHERE numero = '101'), '101', 'Libre'),
    ((SELECT id FROM habitaciones WHERE numero = '102'), '102', 'Ocupada'),    -- Ana Rojas
    ((SELECT id FROM habitaciones WHERE numero = '102'), '103', 'Libre'),
    ((SELECT id FROM habitaciones WHERE numero = '204'), '204', 'Ocupada'),    -- Carlos López
    ((SELECT id FROM habitaciones WHERE numero = '205'), '205', 'Libre'),
    ((SELECT id FROM habitaciones WHERE numero = '205'), '206', 'Bloqueada');  -- en mantenimiento

/* Internaciones ya existentes (para poder probar Enfermería sin pasos previos) */
INSERT INTO camas_historial (cama_id, paciente_id, motivo_ingreso, diagnostico_inicial) VALUES
    ((SELECT id FROM camas WHERE codigo = '204'), @carlos, 'OTRO', N'Observación clínica'),
    ((SELECT id FROM camas WHERE codigo = '102'), @ana,    'OTRO', N'Dolor lumbar agudo');

DECLARE @intCarlos INT = (SELECT id FROM camas_historial WHERE paciente_id = @carlos AND fecha_egreso IS NULL);
DECLARE @intAna    INT = (SELECT id FROM camas_historial WHERE paciente_id = @ana    AND fecha_egreso IS NULL);

/* ---------- RECURSOS: inventario del piso ---------- */
INSERT INTO insumos (nombre, stock) VALUES
    (N'Ibuprofeno 400mg', 50),
    (N'Paracetamol 500mg', 80),
    (N'Solución fisiológica 500ml', 30);

DECLARE @ibu INT = (SELECT id FROM insumos WHERE nombre = N'Ibuprofeno 400mg');

INSERT INTO movimientos_inventarios (insumo_id, tipo, cantidad, motivo)
    SELECT id, 'INGRESO', stock, N'Stock inicial' FROM insumos;

/* ---------- ENFERMERÍA: indicación activa para Ana Rojas ----------
   "Ibuprofeno 400mg cada 8 horas". La primera dosis se programa para el
   momento en que se ejecuta este script, así se puede marcar como
   "Administrada" dentro del margen de +/- 30 minutos. */
INSERT INTO indicaciones_medicas (paciente_id, medico_id, insumo_id, descripcion, frecuencia_horas)
    VALUES (@ana, @silva, @ibu, N'Ibuprofeno 400mg cada 8 horas', 8);

DECLARE @indicacion INT = SCOPE_IDENTITY();
DECLARE @ahora DATETIME2(0) = DATEADD(MINUTE, DATEDIFF(MINUTE, 0, GETUTCDATE()), 0);

INSERT INTO administraciones_medicacion (indicacion_id, hora_programada) VALUES
    (@indicacion, @ahora),
    (@indicacion, DATEADD(HOUR,  8, @ahora)),
    (@indicacion, DATEADD(HOUR, 16, @ahora));

/* ---------- FACTURACIÓN ---------- */
INSERT INTO obras_sociales (nombre, tipo, copago_fijo) VALUES
    (N'Obra Social Pública',      'PUBLICA', 0),
    (N'Medicina Prepaga Premium', 'PREPAGA', 3000);

INSERT INTO coberturas_pacientes (paciente_id, obra_social_id, numero_afiliado) VALUES
    (@juan, (SELECT id FROM obras_sociales WHERE nombre = N'Obra Social Pública'),      'PUB-000123'),
    (@ana,  (SELECT id FROM obras_sociales WHERE nombre = N'Medicina Prepaga Premium'), 'PRE-004567');
-- Carlos López, Luis Medina y Laura Gómez no tienen cobertura: son "Particular".

INSERT INTO prestaciones (codigo, nombre, valor_base) VALUES
    ('CONSULTA_GENERAL', N'Consulta Médica General', 15000);

INSERT INTO precios_insumos (insumo_id, precio_unitario, vigente_desde) VALUES
    ((SELECT id FROM insumos WHERE nombre = N'Ibuprofeno 400mg'),            850,  '2026-01-01'),
    ((SELECT id FROM insumos WHERE nombre = N'Paracetamol 500mg'),           600,  '2026-01-01'),
    ((SELECT id FROM insumos WHERE nombre = N'Solución fisiológica 500ml'), 4200,  '2026-01-01');

/* Cuentas de gastos activas de los dos pacientes internados */
INSERT INTO facturas (paciente_id, internacion_id, tipo, estado) VALUES
    (@carlos, @intCarlos, 'ESTADIA', 'Abierta'),
    (@ana,    @intAna,    'ESTADIA', 'Abierta');
GO

PRINT 'Datos iniciales cargados.';
GO
