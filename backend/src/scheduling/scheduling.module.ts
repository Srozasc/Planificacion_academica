import { Module, forwardRef } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { SchedulingGateway } from './scheduling.gateway';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => AuthModule), // Para los guards de autenticación
  ],
  controllers: [SchedulingController],
  providers: [SchedulingService, SchedulingGateway],
  exports: [SchedulingService, SchedulingGateway], // Exportar para otros módulos
})
export class SchedulingModule {}
