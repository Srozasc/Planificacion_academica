import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseReportData } from './entities/course-report-data.entity';
import { CourseReportsService } from './services/course-reports.service';
import { CourseReportsController } from './controllers/course-reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CourseReportData])],
  controllers: [CourseReportsController],
  providers: [CourseReportsService],
  exports: [CourseReportsService],
})
export class CourseReportsModule {}
