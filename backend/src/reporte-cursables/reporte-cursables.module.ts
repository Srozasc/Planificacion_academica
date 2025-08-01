import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReporteCursablesController } from './reporte-cursables.controller';
import { ReporteCursablesService } from './reporte-cursables.service';
import { ReporteCursablesAprobados } from './entities/reporte-cursables-aprobados.entity';
import { StagingReporteCursables } from './entities/reporte-cursables.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReporteCursablesAprobados,
      StagingReporteCursables,
    ]),
  ],
  controllers: [ReporteCursablesController],
  providers: [ReporteCursablesService],
  exports: [ReporteCursablesService],
})
export class ReporteCursablesModule {}