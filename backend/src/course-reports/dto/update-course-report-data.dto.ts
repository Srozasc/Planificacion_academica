import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseReportDataDto } from './create-course-report-data.dto';

export class UpdateCourseReportDataDto extends PartialType(CreateCourseReportDataDto) {}
