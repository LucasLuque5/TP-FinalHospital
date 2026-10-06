import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class RegistrarSignosVitalesDto {
  @IsInt()
  internacionId: number;

  // Los límites de acá solo descartan errores de tipeo (ej. presión 1200).
  // Que un valor sea "normal" o no se evalúa en rangos-signos-vitales.ts.
  @IsInt()
  @Min(30)
  @Max(300)
  presionSistolica: number;

  @IsInt()
  @Min(20)
  @Max(200)
  presionDiastolica: number;

  @IsInt()
  @Min(20)
  @Max(250)
  frecuenciaCardiaca: number;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(30)
  @Max(45)
  temperatura: number;
}

export class CrearNotaDto {
  @IsInt()
  pacienteId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  texto: string;
}

export class CrearIndicacionDto {
  @IsInt()
  pacienteId: number;

  @IsInt()
  insumoId: number;

  /** Ej. "Ibuprofeno 400mg cada 8 horas" */
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  descripcion: string;

  @IsInt()
  @Min(1)
  @Max(48)
  frecuenciaHoras: number;

  /** Fecha y hora de la primera dosis. */
  @IsDateString()
  primeraDosis: string;

  /** Cuántas dosis programar a partir de la primera. */
  @IsInt()
  @Min(1)
  @Max(30)
  cantidadDosis: number;
}
