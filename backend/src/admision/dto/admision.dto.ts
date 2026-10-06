import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Gestión de agenda médica: genera los turnos disponibles de un día. */
export class GenerarAgendaDto {
  @IsInt()
  medicoId: number;

  @Matches(FORMATO_FECHA, { message: 'La fecha debe tener formato AAAA-MM-DD.' })
  fecha: string;

  @Matches(FORMATO_HORA, { message: 'La hora de inicio debe tener formato HH:mm.' })
  horaInicio: string;

  @Matches(FORMATO_HORA, { message: 'La hora de fin debe tener formato HH:mm.' })
  horaFin: string;

  @IsInt()
  @Min(5)
  @Max(120)
  duracionMinutos: number;
}

export class ReservarTurnoDto {
  @IsInt()
  pacienteId: number;
}

export class InsertarEntreturnoDto {
  @IsInt()
  medicoId: number;

  @IsInt()
  pacienteId: number;

  /** Fecha y hora del entreturno, ej. "2026-10-06T10:15:00". */
  @IsDateString()
  fechaHora: string;
}

export class AgregarListaEsperaDto {
  @IsInt()
  medicoId: number;

  @IsInt()
  pacienteId: number;

  @Matches(FORMATO_FECHA, { message: 'La fecha debe tener formato AAAA-MM-DD.' })
  fecha: string;
}

export class RegistrarTriajeDto {
  @IsInt()
  pacienteId: number;

  @IsInt()
  @Min(1)
  @Max(5)
  nivel: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  motivo: string;
}
