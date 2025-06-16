import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { SchedulingGateway } from './scheduling.gateway';

@Module({
  controllers: [SchedulingController],
  providers: [SchedulingService, SchedulingGateway],
})
export class SchedulingModule {}
