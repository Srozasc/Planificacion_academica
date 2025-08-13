import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StagingOptativos } from './entities/staging-optativos.entity';
import { AsignaturasOptativasAprobadas } from './entities/asignaturas-optativas-aprobadas.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StagingOptativos, AsignaturasOptativasAprobadas]),
    CommonModule,
  ],
  exports: [TypeOrmModule],
})
export class OptativosModule {}