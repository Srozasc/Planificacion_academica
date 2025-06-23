import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Logger,
  Query
} from '@nestjs/common';
import { BimestreService, CreateBimestreDto, UpdateBimestreDto } from '../common/services/bimestre.service';
import { ResponseService } from '../common/services/response.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('bimestres')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BimestresController {
  private readonly logger = new Logger(BimestresController.name);

  constructor(
    private readonly bimestreService: BimestreService,
    private readonly responseService: ResponseService,
  ) {}

  @Get()
  @Roles('admin', 'academico')
  async findAll(@Query('anoAcademico') anoAcademico?: string) {
    try {
      let bimestres;
      
      if (anoAcademico) {
        const ano = parseInt(anoAcademico);
        bimestres = await this.bimestreService.findByAnoAcademico(ano);
      } else {
        bimestres = await this.bimestreService.findAll();
      }

      return this.responseService.success(
        bimestres,
        'Bimestres obtenidos exitosamente'
      );
    } catch (error) {
      this.logger.error('Error al obtener bimestres', error);
      return this.responseService.error(
        'Error al obtener bimestres',
        [error.message]
      );
    }
  }

  @Get('activos')
  @Roles('admin', 'academico', 'docente')
  async findActivos() {
    try {
      const bimestres = await this.bimestreService.findActivos();
      return this.responseService.success(
        bimestres,
        'Bimestres activos obtenidos exitosamente'
      );
    } catch (error) {
      this.logger.error('Error al obtener bimestres activos', error);
      return this.responseService.error(
        'Error al obtener bimestres activos',
        [error.message]
      );
    }
  }

  @Get('actual')
  @Roles('admin', 'academico', 'docente')
  async findBimestreActual() {
    try {
      const bimestre = await this.bimestreService.findBimestreActual();
      return this.responseService.success(
        bimestre,
        bimestre ? 'Bimestre actual encontrado' : 'No hay bimestre activo actualmente'
      );
    } catch (error) {
      this.logger.error('Error al obtener bimestre actual', error);
      return this.responseService.error(
        'Error al obtener bimestre actual',
        [error.message]
      );
    }
  }

  @Get(':id')
  @Roles('admin', 'academico', 'docente')
  async findById(@Param('id', ParseIntPipe) id: number) {
    try {
      const bimestre = await this.bimestreService.findById(id);
      return this.responseService.success(
        bimestre,
        'Bimestre obtenido exitosamente'
      );
    } catch (error) {
      this.logger.error(`Error al obtener bimestre ${id}`, error);
      return this.responseService.error(
        'Error al obtener bimestre',
        [error.message]
      );
    }
  }

  @Post()
  @Roles('admin')
  async create(@Body() createBimestreDto: CreateBimestreDto) {
    try {
      // Convertir strings de fecha a Date objects
      const dto = {
        ...createBimestreDto,
        fechaInicio: new Date(createBimestreDto.fechaInicio),
        fechaFin: new Date(createBimestreDto.fechaFin)
      };

      const bimestre = await this.bimestreService.create(dto);
      return this.responseService.success(
        bimestre,
        'Bimestre creado exitosamente'
      );
    } catch (error) {
      this.logger.error('Error al crear bimestre', error);
      return this.responseService.error(
        'Error al crear bimestre',
        [error.message]
      );
    }
  }

  @Put(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBimestreDto: UpdateBimestreDto
  ) {
    try {
      // Convertir strings de fecha a Date objects si existen
      const dto = { ...updateBimestreDto };
      if (dto.fechaInicio) {
        dto.fechaInicio = new Date(dto.fechaInicio);
      }
      if (dto.fechaFin) {
        dto.fechaFin = new Date(dto.fechaFin);
      }

      const bimestre = await this.bimestreService.update(id, dto);
      return this.responseService.success(
        bimestre,
        'Bimestre actualizado exitosamente'
      );
    } catch (error) {
      this.logger.error(`Error al actualizar bimestre ${id}`, error);
      return this.responseService.error(
        'Error al actualizar bimestre',
        [error.message]
      );
    }
  }

  @Put(':id/activar')
  @Roles('admin')
  async activar(@Param('id', ParseIntPipe) id: number) {
    try {
      const bimestre = await this.bimestreService.activar(id);
      return this.responseService.success(
        bimestre,
        'Bimestre activado exitosamente'
      );
    } catch (error) {
      this.logger.error(`Error al activar bimestre ${id}`, error);
      return this.responseService.error(
        'Error al activar bimestre',
        [error.message]
      );
    }
  }

  @Put(':id/desactivar')
  @Roles('admin')
  async desactivar(@Param('id', ParseIntPipe) id: number) {
    try {
      const bimestre = await this.bimestreService.desactivar(id);
      return this.responseService.success(
        bimestre,
        'Bimestre desactivado exitosamente'
      );
    } catch (error) {
      this.logger.error(`Error al desactivar bimestre ${id}`, error);
      return this.responseService.error(
        'Error al desactivar bimestre',
        [error.message]
      );
    }
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.bimestreService.delete(id);
      return this.responseService.success(
        null,
        'Bimestre eliminado exitosamente'
      );
    } catch (error) {
      this.logger.error(`Error al eliminar bimestre ${id}`, error);
      return this.responseService.error(
        'Error al eliminar bimestre',
        [error.message]
      );
    }
  }

  @Post('generar-ano/:anoAcademico')
  @Roles('admin')
  async generarBimestresAno(
    @Param('anoAcademico', ParseIntPipe) anoAcademico: number,
    @Body('fechaInicioAno') fechaInicioAno: string
  ) {
    try {
      const fechaInicio = new Date(fechaInicioAno);
      const bimestres = await this.bimestreService.generarBimestresAnoAcademico(
        anoAcademico,
        fechaInicio
      );

      return this.responseService.success(
        bimestres,
        `4 bimestres generados exitosamente para el año ${anoAcademico}`
      );
    } catch (error) {
      this.logger.error(`Error al generar bimestres para año ${anoAcademico}`, error);
      return this.responseService.error(
        'Error al generar bimestres',
        [error.message]
      );
    }
  }
}
