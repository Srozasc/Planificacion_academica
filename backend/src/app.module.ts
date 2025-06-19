import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UploadsModule } from './uploads/uploads.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { ReportsModule } from './reports/reports.module';
import { ApprovalModule } from './approval/approval.module';
import { CommonModule } from './common/common.module';
import { AcademicModule } from './academic/academic.module';
import { TeachersModule } from './teachers/teachers.module';
import { PaymentCodesModule } from './payment-codes/payment-codes.module';
import { CourseReportsModule } from './course-reports/course-reports.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule, // Global module providing shared resources
    AuthModule,
    UsersModule,
    AcademicModule,
    TeachersModule,
    PaymentCodesModule,
    CourseReportsModule,
    UploadsModule,
    SchedulingModule,
    ReportsModule,
    ApprovalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
