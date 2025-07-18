import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StagingAdolSimple } from './entities/adol-position.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StagingAdolSimple]),
  ],
  exports: [TypeOrmModule],
})
export class AdolModule {}