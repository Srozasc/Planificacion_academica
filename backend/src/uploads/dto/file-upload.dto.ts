import { IsOptional, IsEnum, IsNumber, IsString, IsBoolean } from 'class-validator';

export class FileUploadDto {
  filename: string;
  mimetype: string;
  size: number;
}

export enum OperationMode {
  INSERT_ONLY = 'INSERT_ONLY',
  UPDATE_ONLY = 'UPDATE_ONLY',
  UPSERT = 'UPSERT'
}

export class BulkUploadOptions {
  @IsOptional()
  @IsEnum(OperationMode)
  mode?: OperationMode = OperationMode.UPSERT;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  validateOnly?: boolean = false;
}

export class UploadResultDto {
  success: boolean;
  message: string;
  totalRecords: number;
  processedRecords: number;
  insertedCount?: number;
  updatedCount?: number;
  errorCount?: number;
  errors?: any[];
  executionTimeMs?: number;
  filename?: string;
  uploadedAt: Date;
}
