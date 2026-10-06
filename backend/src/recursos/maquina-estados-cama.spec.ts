import {
  AccionCama,
  EstadoCama,
  TransicionCamaInvalidaError,
  siguienteEstadoCama,
} from './maquina-estados-cama.js';

describe('Máquina de estados de la cama', () => {
  it('ciclo de vida: Libre -> Ocupada -> En limpieza -> Libre', () => {
    let estado = EstadoCama.Libre;
    estado = siguienteEstadoCama(estado, AccionCama.AsignarPaciente);
    expect(estado).toBe(EstadoCama.Ocupada);
    estado = siguienteEstadoCama(estado, AccionCama.LiberarPorAlta);
    expect(estado).toBe(EstadoCama.EnLimpieza);
    estado = siguienteEstadoCama(estado, AccionCama.ConfirmarLimpieza);
    expect(estado).toBe(EstadoCama.Libre);
  });

  it('una cama Ocupada nunca pasa directo a Libre', () => {
    expect(() => siguienteEstadoCama(EstadoCama.Ocupada, AccionCama.ConfirmarLimpieza)).toThrow(
      TransicionCamaInvalidaError,
    );
  });

  it.each([EstadoCama.Ocupada, EstadoCama.EnLimpieza, EstadoCama.Bloqueada])(
    'no se puede asignar un paciente a una cama "%s"',
    (estado) => {
      expect(() => siguienteEstadoCama(estado, AccionCama.AsignarPaciente)).toThrow(
        TransicionCamaInvalidaError,
      );
    },
  );

  it('mantenimiento: Libre -> Bloqueada -> Libre', () => {
    expect(siguienteEstadoCama(EstadoCama.Libre, AccionCama.Bloquear)).toBe(EstadoCama.Bloqueada);
    expect(siguienteEstadoCama(EstadoCama.Bloqueada, AccionCama.Desbloquear)).toBe(EstadoCama.Libre);
  });
});
