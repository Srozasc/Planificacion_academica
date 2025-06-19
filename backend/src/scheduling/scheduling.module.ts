import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { SchedulingGateway } from './scheduling.gateway';

/**
 * SchedulingModule - Módulo de programación académica
 * 
 * Responsabilidades:
 * - Gestión de eventos de programación académica
 * - WebSocket para comunicación en tiempo real
 * - API REST para CRUD de eventos
 * 
 * Dependencias:
 * - CommonModule (importado globalmente): Base de datos, logger, servicios base, guards
 * 
 * Este módulo NO depende directamente de otros módulos de features,
 * solo usa lo necesario desde CommonModule que se importa globalmente
 */
@Module({
  imports: [
    // CommonModule se importa globalmente, no necesita importación explícita
    // Proporciona: DatabaseService, ResponseService, Logger, JWT Guards, etc.
  ],
  controllers: [SchedulingController],
  providers: [SchedulingService, SchedulingGateway],
  exports: [SchedulingService, SchedulingGateway],
})
export class SchedulingModule {}
