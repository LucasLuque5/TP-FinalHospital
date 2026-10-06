import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FacturarPrestacionDto {
  @IsInt()
  pacienteId: number;

  @IsInt()
  prestacionId: number;
}

export class AsignarCoberturaDto {
  @IsInt()
  pacienteId: number;

  @IsInt()
  obraSocialId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  numeroAfiliado: string;
}
