import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import type { MotivoIngreso } from '../entities/camas.entities.js';

export class AsignarCamaDto {
  @IsInt()
  pacienteId: number;

  @IsIn(['PRE_QUIRURGICO', 'INFECCION_RESPIRATORIA', 'OTRO'])
  motivoIngreso: MotivoIngreso;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  diagnosticoInicial?: string;
}

export class IngresoStockDto {
  @IsInt()
  @Min(1)
  cantidad: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  motivo: string;
}
