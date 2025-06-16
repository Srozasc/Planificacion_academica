import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Role } from '../auth/entities/role.entity';
import { AcademicStructure } from '../academic/entities/academic-structure.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { PaymentCode } from '../payment-codes/entities/payment-code.entity';
import { CourseReportData } from '../course-reports/entities/course-report-data.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST') || 'localhost',
        port: configService.get('DB_PORT') || 3306,
        username: configService.get('DB_USERNAME') || 'root',
        password: configService.get('DB_PASSWORD') || '',
        database: configService.get('DB_NAME') || 'planificacion_academica',        entities: [User, Role, AcademicStructure, Teacher, PaymentCode, CourseReportData], // Agregando las entidades
        synchronize: false, // Desactivado para evitar conflictos
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
