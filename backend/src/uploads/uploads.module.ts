import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsController } from './uploads.controller';
import { UploadService } from './uploads.service';
import { StagingAdolSimple } from '../adol/entities/adol-position.entity';
import { StagingDol } from '../dol/entities/dol-position.entity';
import { DolModule } from '../dol/dol.module';
import { ResponseService } from '../common/services/response.service';
import { multerConfig } from './config/multer.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StagingAdolSimple,
      StagingDol,
    ]),
    MulterModule.register(multerConfig),
    DolModule,
  ],
  controllers: [UploadsController],
  providers: [UploadService, ResponseService],
  exports: [UploadService],
})
export class UploadsModule {}