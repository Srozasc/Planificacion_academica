import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BimestresModule } from './bimestres/bimestres.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { UploadsModule } from './uploads/uploads.module';
import { AdolModule } from './adol/adol.module';
import { DolModule } from './dol/dol.module';
import { VacantesInicioModule } from './vacantes-inicio/vacantes-inicio.module';
import { NominaDocentesModule } from './nomina-docentes/nomina-docentes.module';
import { CarrerasModule } from './carreras/carreras.module';
import { AsignaturasModule } from './asignaturas/asignaturas.module';
import { ConfigModule } from '@nestjs/config';

@Module({  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule,     // Global module providing shared resources
    AuthModule,       // Login and authentication
    BimestresModule,  // Academic semester configuration
    SchedulingModule, // Event scheduling and calendar management
    UsersModule,      // User management
    UploadsModule,    // File upload management
    AdolModule,       // ADOL positions management
    DolModule,        // DOL positions management
    VacantesInicioModule, // Vacantes Inicio management
    NominaDocentesModule, // Nomina Docentes management
    CarrerasModule,       // Carreras management
    AsignaturasModule,    // Asignaturas management
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
