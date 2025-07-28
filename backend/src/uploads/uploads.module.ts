import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsController } from './uploads.controller';
import { UploadService } from './uploads.service';
import { StagingAdolSimple } from '../adol/entities/adol-position.entity';
import { StagingDol } from '../dol/entities/dol-position.entity';
import { StagingVacantesInicio } from '../vacantes-inicio/entities/vacantes-inicio.entity';
import { StagingEstructuraAcademica } from '../estructura-academica/entities/estructura-academica.entity';
import { StagingReporteCursables } from '../reporte-cursables/entities/reporte-cursables.entity';
import { StagingNominaDocentes } from '../nomina-docentes/entities/nomina-docentes.entity';
import { UploadLog } from './entities/upload-log.entity';
import { AcademicStructure } from '../academic/entities/academic-structure.entity';
import { Bimestre } from '../common/entities/bimestre.entity';
import { User } from '../users/entities/user.entity';
import { DolModule } from '../dol/dol.module';
import { ResponseService } from '../common/services/response.service';
import { multerConfig } from './config/multer.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StagingAdolSimple,
      StagingDol,
      StagingVacantesInicio,
      StagingEstructuraAcademica,
      StagingReporteCursables,
      StagingNominaDocentes,
      UploadLog,
      Bimestre,
      User,
      AcademicStructure,
    ]),
    MulterModule.register(multerConfig),
    DolModule,
  ],
  controllers: [UploadsController],
  providers: [UploadService, ResponseService],
  exports: [UploadService],
})
export class UploadsModule {}