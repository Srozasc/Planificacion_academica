import { Module } from '@nestjs/common';
import { BimestresController } from './bimestres.controller';
import { BimestreCleanupController } from '../bimestre/controllers/bimestre-cleanup.controller';
import { BimestreCleanupService } from '../bimestre/services/bimestre-cleanup.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [BimestresController, BimestreCleanupController],
  providers: [BimestreCleanupService],
  exports: [BimestreCleanupService],
})
export class BimestresModule {}
