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
  }  @Post()
  @Roles('admin', 'academico')
  async create(@Body() createBimestreDto: CreateBimestreDto) {
    try {
      const bimestre = await this.bimestreService.create(createBimestreDto);
      return this.responseService.success(
        bimestre,
        'Bimestre creado exitosamente'
      );    } catch (error) {
      this.logger.error('Error al crear bimestre', error);
      throw error; // Re-lanzar la excepción para que NestJS la maneje correctamente
    }
  }@Put(':id')
  @Roles('admin', 'academico')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBimestreDto: UpdateBimestreDto
  ) {
    try {
      const bimestre = await this.bimestreService.update(id, updateBimestreDto);
      return this.responseService.success(
        bimestre,
        'Bimestre actualizado exitosamente'
      );    } catch (error) {
      this.logger.error(`Error al actualizar bimestre ${id}`, error);
      throw error; // Re-lanzar la excepción para que NestJS la maneje correctamente
    }
  }
  @Delete(':id')
  @Roles('admin', 'academico')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.bimestreService.delete(id);
      return this.responseService.success(
        null,
        'Bimestre eliminado exitosamente'
      );    } catch (error) {
      this.logger.error(`Error al eliminar bimestre ${id}`, error);
      throw error; // Re-lanzar la excepción para que NestJS la maneje correctamente
    }
  }
}
