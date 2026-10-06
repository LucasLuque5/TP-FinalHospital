import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CrearPacienteDto {
  @Matches(/^\d{7,9}$/, { message: 'El DNI debe tener entre 7 y 9 números, sin puntos.' })
  dni: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  apellido: string;

  @IsDateString({}, { message: 'La fecha de nacimiento debe tener formato AAAA-MM-DD.' })
  fechaNacimiento: string;

  @IsOptional()
  @IsIn(['F', 'M', 'X'])
  sexo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  direccion?: string;
}

/** Datos de contacto que se pueden corregir después del registro. */
export class ActualizarPacienteDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  direccion?: string;
}

export class CrearAlergiaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sustancia: string;

  @IsIn(['Leve', 'Moderada', 'Grave'])
  severidad: 'Leve' | 'Moderada' | 'Grave';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  observaciones?: string;
}

export class CrearAntecedenteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  parentesco: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  enfermedad: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  observaciones?: string;
}

export class CrearEvolucionDto {
  @IsString()
  @IsNotEmpty()
  descripcion: string;
}
