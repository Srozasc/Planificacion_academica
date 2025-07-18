import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StagingNominaDocentes } from './entities/nomina-docentes.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StagingNominaDocentes]),
  ],
  exports: [TypeOrmModule],
})
export class NominaDocentesModule {}