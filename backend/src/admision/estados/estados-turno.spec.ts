import { NombreEstadoTurno, TransicionInvalidaError, type TurnoConEstado } from './estado-turno.js';
import { obtenerEstado } from './estados-concretos.js';

const turnoEn = (estado: NombreEstadoTurno): TurnoConEstado => ({ estado });

describe('Patrón State - estados del turno', () => {
  it('recorre el flujo completo: Disponible -> Programado -> Confirmado -> En Sala de Espera -> Atendido', () => {
    const turno = turnoEn(NombreEstadoTurno.Disponible);

    obtenerEstado(turno.estado).reservar(turno);
    expect(turno.estado).toBe(NombreEstadoTurno.Programado);

    obtenerEstado(turno.estado).confirmar(turno);
    expect(turno.estado).toBe(NombreEstadoTurno.Confirmado);

    obtenerEstado(turno.estado).registrarLlegada(turno);
    expect(turno.estado).toBe(NombreEstadoTurno.EnSalaDeEspera);

    obtenerEstado(turno.estado).atender(turno);
    expect(turno.estado).toBe(NombreEstadoTurno.Atendido);
  });

  it.each([
    NombreEstadoTurno.Programado,
    NombreEstadoTurno.Confirmado,
    NombreEstadoTurno.EnSalaDeEspera,
  ])('permite cancelar un turno en estado "%s"', (estado) => {
    const turno = turnoEn(estado);
    obtenerEstado(turno.estado).cancelar(turno);
    expect(turno.estado).toBe(NombreEstadoTurno.Cancelado);
  });

  it('un turno Cancelado no puede avanzar (HU 2.1, Escenario 2)', () => {
    const turno = turnoEn(NombreEstadoTurno.Cancelado);

    expect(() => obtenerEstado(turno.estado).atender(turno)).toThrow(
      'Un turno cancelado no puede avanzar en el flujo de atención.',
    );
    expect(() => obtenerEstado(turno.estado).confirmar(turno)).toThrow(TransicionInvalidaError);
    expect(turno.estado).toBe(NombreEstadoTurno.Cancelado); // no cambió
  });

  it('no permite saltear pasos ni operar sobre un turno Atendido', () => {
    const programado = turnoEn(NombreEstadoTurno.Programado);
    expect(() => obtenerEstado(programado.estado).atender(programado)).toThrow(TransicionInvalidaError);
    expect(() => obtenerEstado(programado.estado).registrarLlegada(programado)).toThrow(TransicionInvalidaError);

    const atendido = turnoEn(NombreEstadoTurno.Atendido);
    expect(() => obtenerEstado(atendido.estado).cancelar(atendido)).toThrow(TransicionInvalidaError);
  });
});
