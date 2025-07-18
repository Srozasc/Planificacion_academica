import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StagingVacantesInicio } from './entities/vacantes-inicio.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StagingVacantesInicio]),
    CommonModule,
  ],
  exports: [TypeOrmModule],
})
export class VacantesInicioModule {}