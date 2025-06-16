import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicStructure } from './entities/academic-structure.entity';
import { AcademicStructuresController } from './controllers/academic-structures.controller';
import { AcademicStructuresService } from './services/academic-structures.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AcademicStructure])
  ],
  controllers: [AcademicStructuresController],
  providers: [AcademicStructuresService],
  exports: [AcademicStructuresService]
})
export class AcademicModule {}
