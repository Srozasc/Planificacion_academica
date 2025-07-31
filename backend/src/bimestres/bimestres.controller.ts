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
  Query,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../uploads/config/multer.config';
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
  @Roles('Maestro', 'Editor')
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
  @Roles('Maestro', 'Editor')
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

  @Post('carga-masiva')
  @Roles('Maestro', 'Editor')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async cargaMasiva(@UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        return this.responseService.error(
          'No se proporcionó ningún archivo',
          ['Debe seleccionar un archivo Excel']
        );
      }

      const resultado = await this.bimestreService.procesarCargaMasiva(file.buffer);
      
      return this.responseService.success(
        resultado,
        `Carga masiva completada exitosamente. ${resultado.bimestresCreados} bimestres creados.`
      );
    } catch (error) {
      this.logger.error('Error en carga masiva de bimestres', error);
      return this.responseService.error(
        'Error en la carga masiva',
        [error.message]
      );
    }
  }

  @Get(':id/dependencies')
  @Roles('Maestro')
  async checkDependencies(@Param('id', ParseIntPipe) id: number) {
    try {
      const dependencies = await this.bimestreService.checkDependencies(id);
      return this.responseService.success(
        dependencies,
        'Dependencias verificadas exitosamente'
      );
    } catch (error) {
      this.logger.error(`Error al verificar dependencias del bimestre ${id}`, error);
      throw error;
    }
  }

  @Delete(':id/with-events')
  @Roles('Maestro')
  async removeWithEvents(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.bimestreService.deleteWithEvents(id);
      return this.responseService.success(
        null,
        'Bimestre y eventos asociados eliminados exitosamente'
      );
    } catch (error) {
      this.logger.error(`Error al eliminar bimestre con eventos ${id}`, error);
      throw error;
    }
  }

  @Delete(':id')
  @Roles('Maestro')
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
