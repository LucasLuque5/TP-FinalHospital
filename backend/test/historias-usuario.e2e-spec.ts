/**
 * PRUEBAS DE PUNTA A PUNTA (e2e) DE LAS HISTORIAS DE USUARIO
 *
 * Cada "describe" corresponde a una historia y cada "it" a un escenario
 * Gherkin de las consignas. Las pruebas le pegan al backend REAL por HTTP,
 * que a su vez usa la base de datos REAL.
 *
 * Cómo ejecutarlas (3 pasos, en este orden):
 *   1) npm run db:crear     -> deja la base con los datos iniciales
 *   2) npm run start        -> levanta el backend (dejarlo corriendo)
 *   3) npm run test:e2e     -> en otra terminal
 */
const URL_BASE = process.env.API_URL ?? 'http://localhost:3000';
const CLAVE = 'Hospital123'; // contraseña de los usuarios de prueba (ver 02-datos-iniciales.sql)

interface Respuesta<T = any> {
  status: number;
  body: T;
}

/** Inicia sesión y devuelve una función para hacer peticiones con ese usuario. */
async function iniciarSesion(nombreUsuario: string) {
  const login = await fetch(`${URL_BASE}/iam/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombreUsuario, password: CLAVE }),
  });
  const { token } = await login.json();

  return async function pedir<T = any>(metodo: string, ruta: string, datos?: unknown): Promise<Respuesta<T>> {
    const respuesta = await fetch(`${URL_BASE}${ruta}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: datos === undefined ? undefined : JSON.stringify(datos),
    });
    const texto = await respuesta.text();
    return { status: respuesta.status, body: texto ? JSON.parse(texto) : null };
  };
}

/** Los eventos se procesan en segundo plano: se espera un instante antes de verificar. */
const esperarEventos = () => new Promise((resolver) => setTimeout(resolver, 600));

type Cliente = Awaited<ReturnType<typeof iniciarSesion>>;
let admin: Cliente, recepcion: Cliente, medico: Cliente, enfermero: Cliente, paciente: Cliente;
let pacientes: Record<string, number>; // "Carlos López" -> id
let medicoId: number;

const dosCifras = (numero: number) => String(numero).padStart(2, '0');
/** Las fechas viajan en formato ISO (UTC); acá se pasan a hora y fecha locales. */
const horaLocal = (iso: string) => {
  const fecha = new Date(iso);
  return `${dosCifras(fecha.getHours())}:${dosCifras(fecha.getMinutes())}`;
};
const fechaLocal = (fecha: Date) =>
  `${fecha.getFullYear()}-${dosCifras(fecha.getMonth() + 1)}-${dosCifras(fecha.getDate())}`;

const turnoDeLas = (turnos: any[], hora: string) =>
  turnos.find((t) => horaLocal(t.fechaHoraInicio) === hora && t.estado !== 'Cancelado');

beforeAll(async () => {
  [admin, recepcion, medico, enfermero, paciente] = await Promise.all(
    ['admin', 'recepcion', 'dsilva', 'mtorres', 'clopez'].map(iniciarSesion),
  );
  const lista = (await recepcion('GET', '/hce/pacientes')).body;
  pacientes = Object.fromEntries(lista.map((p: any) => [`${p.nombre} ${p.apellido}`, p.id]));
  medicoId = (await recepcion('GET', '/iam/medicos')).body[0].id;
});

describe('IAM - Autenticación y control de acceso por roles (RBAC)', () => {
  it('rechaza peticiones sin iniciar sesión (401)', async () => {
    const respuesta = await fetch(`${URL_BASE}/hce/pacientes`);
    expect(respuesta.status).toBe(401);
  });

  it('rechaza una contraseña incorrecta (401)', async () => {
    const respuesta = await fetch(`${URL_BASE}/iam/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreUsuario: 'admin', password: 'incorrecta' }),
    });
    expect(respuesta.status).toBe(401);
  });

  it('impide que un rol use funciones de otro (403)', async () => {
    expect((await enfermero('GET', '/iam/usuarios')).status).toBe(403);
    expect((await recepcion('GET', '/facturacion/facturas')).status).toBe(403);
    expect((await paciente('GET', '/hce/pacientes')).status).toBe(403);
  });
});

describe('Admisión HU 1.1 - Reserva de turno seguro', () => {
  it('Escenario 1: reserva exitosa -> el turno queda "Programado" a nombre del paciente', async () => {
    const turnos = (await recepcion('GET', `/admision/turnos?medicoId=${medicoId}`)).body;
    const turno = turnoDeLas(turnos, '09:30');

    const reserva = await recepcion('POST', `/admision/turnos/${turno.id}/reservar`, {
      pacienteId: pacientes['Carlos López'],
    });

    expect(reserva.status).toBe(200);
    expect(reserva.body.estado).toBe('Programado');
    expect(reserva.body.paciente.apellido).toBe('López');
  });

  it('Escenario 2: dos reservas simultáneas del mismo turno -> solo una tiene éxito', async () => {
    const turnos = (await recepcion('GET', `/admision/turnos?medicoId=${medicoId}`)).body;
    const turno = turnoDeLas(turnos, '10:00');

    // Promise.all dispara las dos peticiones al mismo tiempo.
    const [a, b] = await Promise.all([
      recepcion('POST', `/admision/turnos/${turno.id}/reservar`, { pacienteId: pacientes['Carlos López'] }),
      admin('POST', `/admision/turnos/${turno.id}/reservar`, { pacienteId: pacientes['Laura Gómez'] }),
    ]);

    const estados = [a.status, b.status].sort();
    expect(estados).toEqual([200, 409]);
    const rechazada = a.status === 409 ? a : b;
    expect(rechazada.body.message).toContain('acaba de ser ocupado');
  });
});

describe('Admisión HU 1.2 - Entreturno dinámico', () => {
  it('Escenario 1: entreturno 10:15 -> el turno de 10:00 pasa a 15 min y se crea 10:15-10:30', async () => {
    const fecha = fechaLocal(new Date());

    const entreturno = await recepcion('POST', '/admision/entreturnos', {
      medicoId,
      pacienteId: pacientes['Luis Medina'],
      fechaHora: `${fecha}T10:15:00`,
    });
    expect(entreturno.status).toBe(201);
    expect(entreturno.body.duracionMinutos).toBe(15);
    expect(entreturno.body.esEntreturno).toBe(true);

    const turnos = (await recepcion('GET', `/admision/turnos?medicoId=${medicoId}`)).body;
    const deLas10 = turnoDeLas(turnos, '10:00');
    expect(deLas10.duracionMinutos).toBe(15);
    expect(deLas10.tiempoReducido).toBe(true); // etiqueta visual
    expect(turnoDeLas(turnos, '10:30').duracionMinutos).toBe(30); // el siguiente no cambia
    expect(new Set(turnos.map((t: any) => t.id)).size).toBe(turnos.length); // sin IDs repetidos
  });
});

describe('Admisión HU 1.3 - Lista de espera por cancelación', () => {
  it('Escenario 1: al cancelarse el turno de las 11:00 se asigna al primero de la lista', async () => {
    const turnos = (await recepcion('GET', `/admision/turnos?medicoId=${medicoId}`)).body;
    const deLas11 = turnoDeLas(turnos, '11:00');
    await recepcion('POST', `/admision/turnos/${deLas11.id}/reservar`, { pacienteId: pacientes['Laura Gómez'] });

    const fecha = fechaLocal(new Date(deLas11.fechaHoraInicio));
    const espera = await recepcion('POST', '/admision/lista-espera', {
      medicoId,
      pacienteId: pacientes['Luis Medina'],
      fecha,
    });
    expect(espera.status).toBe(201);

    const cancelacion = await recepcion('POST', `/admision/turnos/${deLas11.id}/cancelar`);
    expect(cancelacion.body.estado).toBe('Cancelado');

    const despues = (await recepcion('GET', `/admision/turnos?medicoId=${medicoId}`)).body;
    const nuevoDeLas11 = turnoDeLas(despues, '11:00');
    expect(nuevoDeLas11.id).not.toBe(deLas11.id);
    expect(nuevoDeLas11.estado).toBe('Programado');
    expect(nuevoDeLas11.paciente.apellido).toBe('Medina');

    // Salió de la cola y se alertó a recepción.
    expect((await recepcion('GET', '/admision/lista-espera')).body).toHaveLength(0);
    const avisos = (await recepcion('GET', '/notificaciones')).body;
    expect(avisos[0].mensaje).toContain('Luis Medina');
  });
});

describe('Admisión HU 2.1 - Máquina de estados del turno (patrón State)', () => {
  it('Escenario 1: "Confirmado" -> "En Sala de Espera" y se alerta al médico', async () => {
    const turnos = (await recepcion('GET', `/admision/turnos?medicoId=${medicoId}`)).body;
    const deJuan = turnoDeLas(turnos, '09:00');
    expect(deJuan.estado).toBe('Confirmado');

    const llegada = await recepcion('POST', `/admision/turnos/${deJuan.id}/llegada`);
    expect(llegada.status).toBe(200);
    expect(llegada.body.estado).toBe('En Sala de Espera');

    const avisos = (await medico('GET', '/notificaciones')).body;
    expect(avisos[0].mensaje).toContain('Juan Gómez');
  });

  it('Escenario 2: un turno "Cancelado" no puede pasar a "Atendido"', async () => {
    const turnos = (await recepcion('GET', `/admision/turnos?medicoId=${medicoId}`)).body;
    const cancelado = turnos.find((t: any) => t.estado === 'Cancelado');

    const intento = await medico('POST', `/admision/turnos/${cancelado.id}/atender`);

    expect(intento.status).toBe(422);
    expect(intento.body.message).toBe('Un turno cancelado no puede avanzar en el flujo de atención.');
  });

  it('no permite saltear estados: "Programado" no puede pasar directo a "En Sala de Espera"', async () => {
    const turnos = (await recepcion('GET', `/admision/turnos?medicoId=${medicoId}`)).body;
    const programado = turnos.find((t: any) => t.estado === 'Programado');
    expect((await recepcion('POST', `/admision/turnos/${programado.id}/llegada`)).status).toBe(422);
  });
});

describe('Admisión HU 3.1 - Triaje de guardia', () => {
  it('Escenario 1: un Código Rojo queda primero en la cola y alerta a los médicos', async () => {
    await enfermero('POST', '/admision/guardia', {
      pacienteId: pacientes['Luis Medina'],
      nivel: 4,
      motivo: 'Esguince de tobillo',
    });
    const rojo = await enfermero('POST', '/admision/guardia', {
      pacienteId: pacientes['Laura Gómez'],
      nivel: 1,
      motivo: 'Dolor de pecho intenso',
    });
    expect(rojo.body.posicion).toBe(1);

    const cola = (await medico('GET', '/admision/guardia')).body;
    expect(cola.map((c: any) => c.paciente.nombre)).toEqual(['Laura', 'Luis']);

    const avisos = (await medico('GET', '/notificaciones')).body;
    expect(avisos[0].prioridad).toBe('ALTA');
    expect(avisos[0].titulo).toContain('CÓDIGO ROJO');

    // Se vacía la cola para dejar libres a los pacientes.
    for (const item of cola) await medico('POST', `/admision/guardia/${item.id}/atender`);
  });
});

describe('Recursos HU 1.1 - Asignación segura de cama', () => {
  it('Escenario 2: dos asignaciones simultáneas de la Cama 101 -> solo una tiene éxito', async () => {
    const camas = (await recepcion('GET', '/recursos/camas')).body;
    const cama101 = camas.find((c: any) => c.codigo === '101');
    expect(cama101.estado).toBe('Libre');

    const [a, b] = await Promise.all([
      recepcion('POST', `/recursos/camas/${cama101.id}/asignar`, {
        pacienteId: pacientes['Laura Gómez'],
        motivoIngreso: 'PRE_QUIRURGICO',
      }),
      admin('POST', `/recursos/camas/${cama101.id}/asignar`, {
        pacienteId: pacientes['Luis Medina'],
        motivoIngreso: 'INFECCION_RESPIRATORIA',
        diagnosticoInicial: 'Neumonía',
      }),
    ]);

    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect((a.status === 409 ? a : b).body.message).toContain('acaba de ser ocupada');

    // Escenario 1: la cama quedó "Ocupada" y vinculada a UN solo paciente.
    const despues = (await recepcion('GET', '/recursos/camas')).body.find((c: any) => c.codigo === '101');
    expect(despues.estado).toBe('Ocupada');
    expect(despues.internacion.paciente).toBeTruthy();
  });
});

describe('Enfermería HU 2.1 - Protocolos de atención (patrón Builder)', () => {
  it('genera automáticamente el protocolo que corresponde al motivo de ingreso', async () => {
    // Se interna a Juan Gómez por neumonía (la cama 101 ya generó el otro protocolo).
    const camas = (await recepcion('GET', '/recursos/camas')).body;
    const cama103 = camas.find((c: any) => c.codigo === '103');
    await recepcion('POST', `/recursos/camas/${cama103.id}/asignar`, {
      pacienteId: pacientes['Juan Gómez'],
      motivoIngreso: 'INFECCION_RESPIRATORIA',
      diagnosticoInicial: 'Neumonía',
    });
    await esperarEventos();

    const protocolos = (await enfermero('GET', '/enfermeria/protocolos')).body;
    const tareasDe = (nombre: string) =>
      protocolos.find((p: any) => p.nombre === nombre)?.tareas.map((t: any) => t.descripcion);

    expect(tareasDe('Ingreso por Infección Respiratoria')).toEqual(
      expect.arrayContaining([
        'Monitoreo de saturación de oxígeno continuo',
        'Indicación de aislamiento de contacto y gotas',
      ]),
    );
    // El de la cama 101 pudo ser de cualquiera de los dos tipos (según quién ganó la carrera).
    expect(protocolos.length).toBe(2);
  });
});

describe('Recursos HU 2.1 - Higiene y mantenimiento (máquina de estados de la cama)', () => {
  it('Escenario 1 y 2: alta -> "En limpieza" (no asignable) -> maestranza confirma -> "Libre"', async () => {
    const internaciones = (await medico('GET', '/recursos/internaciones')).body;
    const deJuan = internaciones.find((i: any) => i.pacienteId === pacientes['Juan Gómez']);

    const alta = await medico('POST', `/recursos/internaciones/${deJuan.id}/alta`);
    expect(alta.status).toBe(200);

    const estadoDeLaCama = async () =>
      (await recepcion('GET', '/recursos/camas')).body.find((c: any) => c.id === deJuan.camaId).estado;
    expect(await estadoDeLaCama()).toBe('En limpieza');

    // No se puede asignar una cama en limpieza.
    const intento = await recepcion('POST', `/recursos/camas/${deJuan.camaId}/asignar`, {
      pacienteId: pacientes['Juan Gómez'],
      motivoIngreso: 'OTRO',
    });
    expect(intento.status).toBe(422);

    const limpieza = await enfermero('POST', `/recursos/camas/${deJuan.camaId}/confirmar-limpieza`);
    expect(limpieza.status).toBe(200);
    expect(await estadoDeLaCama()).toBe('Libre');
  });

  it('una cama "Ocupada" no puede pasar directo a "Libre"', async () => {
    const ocupada = (await recepcion('GET', '/recursos/camas')).body.find((c: any) => c.estado === 'Ocupada');
    expect((await enfermero('POST', `/recursos/camas/${ocupada.id}/confirmar-limpieza`)).status).toBe(422);
  });
});

describe('Enfermería HU 1.1 - Signos vitales', () => {
  let internacionDeCarlos: number;

  beforeAll(async () => {
    const internaciones = (await enfermero('GET', '/recursos/internaciones')).body;
    internacionDeCarlos = internaciones.find((i: any) => i.pacienteId === pacientes['Carlos López']).id;
  });

  it('Escenario 1: valores normales -> se guarda y se agrega una nota automática', async () => {
    const registro = await enfermero('POST', '/enfermeria/signos-vitales', {
      internacionId: internacionDeCarlos,
      presionSistolica: 120,
      presionDiastolica: 80,
      frecuenciaCardiaca: 72,
      temperatura: 36.5,
    });
    expect(registro.status).toBe(201);
    expect(registro.body.fueraDeRango).toBe(false);
    expect(registro.body.registradoEn).toBeTruthy();

    const notas = (await enfermero('GET', `/enfermeria/notas?pacienteId=${pacientes['Carlos López']}`)).body;
    expect(notas[0].automatica).toBe(true);
    expect(notas[0].texto).toContain('realizado con éxito');
  });

  it('Escenario 2: temperatura mayor a 39 °C -> registro en rojo y alerta al médico', async () => {
    const registro = await enfermero('POST', '/enfermeria/signos-vitales', {
      internacionId: internacionDeCarlos,
      presionSistolica: 125,
      presionDiastolica: 82,
      frecuenciaCardiaca: 95,
      temperatura: 39.5,
    });
    expect(registro.body.fueraDeRango).toBe(true);

    const avisos = (await medico('GET', '/notificaciones')).body;
    expect(avisos[0].prioridad).toBe('ALTA');
    expect(avisos[0].mensaje).toContain('Carlos López');
    expect(avisos[0].mensaje).toContain('39.5');
  });
});

describe('Medicación: Enfermería HU 1.2 + Recursos HU 3.1 + Facturación HU 2.1', () => {
  it('al administrar una dosis: queda el enfermero, baja el stock 50 -> 49 y se genera el cargo', async () => {
    const stockDeIbuprofeno = async () =>
      (await enfermero('GET', '/recursos/insumos')).body.find((i: any) => i.nombre === 'Ibuprofeno 400mg').stock;
    expect(await stockDeIbuprofeno()).toBe(50);

    const dosis = (await enfermero('GET', '/enfermeria/medicacion')).body;
    const pendiente = dosis.find((d: any) => d.estado === 'Pendiente'); // la primera está en horario

    const administrada = await enfermero('POST', `/enfermeria/medicacion/${pendiente.id}/administrar`);
    expect(administrada.status).toBe(200);
    expect(administrada.body.estado).toBe('Administrada');
    expect(administrada.body.enfermero.nombreUsuario).toBe('mtorres');
    const eventoId: string = administrada.body.eventoId;

    await esperarEventos();

    // Recursos HU 3.1: descuento atómico del stock.
    expect(await stockDeIbuprofeno()).toBe(49);

    // Facturación HU 2.1: línea "Insumos de Farmacia" vinculada al ID del evento.
    const items = (await admin('GET', '/facturacion/facturas-items')).body;
    const cargo = items.find((i: any) => i.eventoId?.toLowerCase() === eventoId.toLowerCase());
    expect(cargo.concepto).toBe('Insumos de Farmacia');
    expect(cargo.importe).toBe(850);
    expect(cargo.factura.paciente.apellido).toBe('Rojas');

    // La misma dosis no se puede administrar dos veces.
    expect((await enfermero('POST', `/enfermeria/medicacion/${pendiente.id}/administrar`)).status).toBe(409);
  });

  it('rechaza una dosis fuera del margen de +/- 30 minutos', async () => {
    const dosis = (await enfermero('GET', '/enfermeria/medicacion')).body;
    const futura = dosis.find((d: any) => d.estado === 'Pendiente'); // la de dentro de 8 horas

    const intento = await enfermero('POST', `/enfermeria/medicacion/${futura.id}/administrar`);
    expect(intento.status).toBe(422);
    expect(intento.body.message).toContain('Fuera del margen permitido');
  });
});

describe('Facturación HU 1.1 - Cálculo de costos (patrón Strategy)', () => {
  let consultaId: number;
  const importeDe = (factura: any, pagador: string) =>
    factura.items.find((i: any) => i.aCargoDe === pagador)?.importe;

  beforeAll(async () => {
    consultaId = (await admin('GET', '/facturacion/prestaciones')).body[0].id;
  });

  it('Escenario 1: cobertura pública -> paciente $0, Estado $15000', async () => {
    const factura = (
      await admin('POST', '/facturacion/facturas', { pacienteId: pacientes['Juan Gómez'], prestacionId: consultaId })
    ).body;
    expect(importeDe(factura, 'PACIENTE')).toBe(0);
    expect(importeDe(factura, 'ESTADO')).toBe(15000);
  });

  it('Escenario 2: prepaga -> paciente $3000 de copago, prepaga $12000', async () => {
    const factura = (
      await admin('POST', '/facturacion/facturas', { pacienteId: pacientes['Ana Rojas'], prestacionId: consultaId })
    ).body;
    expect(importeDe(factura, 'PACIENTE')).toBe(3000);
    expect(importeDe(factura, 'PREPAGA')).toBe(12000);
  });

  it('Regla: particular sin cobertura -> paciente paga el 100 %', async () => {
    const factura = (
      await admin('POST', '/facturacion/facturas', { pacienteId: pacientes['Carlos López'], prestacionId: consultaId })
    ).body;
    expect(factura.items).toHaveLength(1);
    expect(importeDe(factura, 'PACIENTE')).toBe(15000);
  });

  it('cargo automático: al marcar un turno como "Atendido" se factura la consulta', async () => {
    const antes = (await admin('GET', '/facturacion/facturas')).body.length;
    const turnos = (await medico('GET', `/admision/turnos?medicoId=${medicoId}`)).body;
    const enSala = turnos.find((t: any) => t.estado === 'En Sala de Espera');

    expect((await medico('POST', `/admision/turnos/${enSala.id}/atender`)).body.estado).toBe('Atendido');
    await esperarEventos();

    expect((await admin('GET', '/facturacion/facturas')).body.length).toBe(antes + 1);
  });
});
