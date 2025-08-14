import { Controller, Get, Query, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { AsignaturasService } from './asignaturas.service';
import { Asignatura } from './entities/asignatura.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('asignaturas')
export class AsignaturasController {
  constructor(private readonly asignaturasService: AsignaturasService) {}

  @Get()
  async findAll(@Query('bimestreId') bimestreId?: string): Promise<Asignatura[]> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.asignaturasService.findAll(bimestreIdNum);
  }

  @Get('categorias')
  async getCategorias(@Query('bimestreId') bimestreId?: string): Promise<string[]> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.asignaturasService.getCategorias(bimestreIdNum);
  }

  @Get('carrera/:carreraId')
  async findByCarrera(
    @Param('carreraId', ParseIntPipe) carreraId: number,
    @Query('bimestreId') bimestreId?: string
  ): Promise<Asignatura[]> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.asignaturasService.findByCarrera(carreraId, bimestreIdNum);
  }

  @Get('bimestre/:bimestreId')
  async findByBimestre(@Param('bimestreId', ParseIntPipe) bimestreId: number): Promise<Asignatura[]> {
    return this.asignaturasService.findByBimestre(bimestreId);
  }

  @Get('adol-aprobados')
  async getAdolAprobados(@Query('bimestreId') bimestreId?: string): Promise<{ sigla: string; descripcion: string }[]> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.asignaturasService.getAdolAprobados(bimestreIdNum);
  }

  @Get('optativos-aprobados')
  @UseGuards(JwtAuthGuard)
  async getOptativosAprobados(
    @Query('bimestreId') bimestreId?: string
  ): Promise<{ plan: string; descripcion_asignatura: string; nivel: string; asignatura: string }[]> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.asignaturasService.getOptativosAprobados(null, bimestreIdNum);
  }
}