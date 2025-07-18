import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StagingDol } from './entities/dol-position.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StagingDol]),
    CommonModule,
  ],
  exports: [TypeOrmModule],
})
export class DolModule {}