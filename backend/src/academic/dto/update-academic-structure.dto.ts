import { PartialType } from '@nestjs/mapped-types';
import { CreateAcademicStructureDto } from './create-academic-structure.dto';
import { IsOptional } from 'class-validator';
import { AcademicStructureType } from '../entities/academic-structure.entity';

export class UpdateAcademicStructureDto extends PartialType(CreateAcademicStructureDto) {
  @IsOptional()
  code?: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  credits?: number;

  @IsOptional()
  plan_id?: number;

  @IsOptional()
  type?: AcademicStructureType;

  @IsOptional()
  semester?: number;

  @IsOptional()
  prerequisites?: string[];

  @IsOptional()
  description?: string;

  @IsOptional()
  hours_per_week?: number;

  @IsOptional()
  is_active?: boolean;
}
