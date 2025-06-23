import { Module } from '@nestjs/common';
import { BimestresController } from './bimestres.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [BimestresController],
})
export class BimestresModule {}
