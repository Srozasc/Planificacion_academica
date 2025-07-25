import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { CarrerasService } from './carreras.service';
import { Carrera } from './entities/carrera.entity';

@Controller('carreras')
export class CarrerasController {
  constructor(private readonly carrerasService: CarrerasService) {}

  @Get()
  async findAll(@Query('bimestreId') bimestreId?: string): Promise<Carrera[]> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.carrerasService.findAll(bimestreIdNum);
  }

  @Get('bimestre/:bimestreId')
  async findByBimestre(@Param('bimestreId', ParseIntPipe) bimestreId: number): Promise<Carrera[]> {
    return this.carrerasService.findByBimestre(bimestreId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('bimestreId') bimestreId?: string
  ): Promise<Carrera | null> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.carrerasService.findOne(id, bimestreIdNum);
  }
}