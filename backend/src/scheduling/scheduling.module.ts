import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { DropdownController } from './controllers/dropdown.controller';
import { DropdownService } from './services/dropdown.service';
import { ScheduleEvent } from './entities/schedule-event.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduleEvent]),
    CommonModule,
  ],
  controllers: [SchedulingController, DropdownController],
  providers: [SchedulingService, DropdownService],
  exports: [SchedulingService, DropdownService],
})
export class SchedulingModule {}
