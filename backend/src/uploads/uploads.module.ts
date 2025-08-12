import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsController } from './uploads.controller';
import { UploadService } from './uploads.service';
import { StagingAdolSimple } from '../adol/entities/adol-position.entity';
import { AdolAprobados } from '../adol/entities/adol-aprobados.entity';
import { StagingDol } from '../dol/entities/dol-position.entity';
import { DolAprobados } from '../dol/entities/dol-aprobados.entity';
import { StagingVacantesInicio } from '../vacantes-inicio/entities/vacantes-inicio.entity';
import { StagingEstructuraAcademica } from '../estructura-academica/entities/estructura-academica.entity';
import { StagingReporteCursables } from '../reporte-cursables/entities/reporte-cursables.entity';
import { StagingNominaDocentes } from '../nomina-docentes/entities/nomina-docentes.entity';
import { StagingOptativos } from '../optativos/entities/staging-optativos.entity';
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
      AdolAprobados,
      StagingDol,
      DolAprobados,
      StagingVacantesInicio,
      StagingEstructuraAcademica,
      StagingReporteCursables,
      StagingNominaDocentes,
      StagingOptativos,
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