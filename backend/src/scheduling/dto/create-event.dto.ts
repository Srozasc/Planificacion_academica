import { IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateEventDto {
  @IsNumber()
  asignaturaId: number;

  @IsNumber()
  docenteId: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  diaSemana: string;

  @IsString()
  horaInicio: string;

  @IsString()
  horaFin: string;

  @IsOptional()
  @IsString()
  aula?: string;

  @IsOptional()
  @IsNumber()
  vacantes?: number;

  @IsNumber()
  areaId: number;
}
