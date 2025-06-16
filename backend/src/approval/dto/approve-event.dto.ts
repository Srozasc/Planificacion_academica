import { IsOptional, IsString } from 'class-validator';

export class ApproveEventDto {
  @IsOptional()
  @IsString()
  comment?: string;
}
