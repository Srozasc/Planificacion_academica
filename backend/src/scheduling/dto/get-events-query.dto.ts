import { IsOptional, IsInt, IsDateString, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class GetEventsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  area_id?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  teacher_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  status_id?: number;
}
