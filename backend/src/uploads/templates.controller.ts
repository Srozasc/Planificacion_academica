import { 
  Controller, 
  Get,
  Param,
  HttpStatus,
  HttpCode,
  BadRequestException,
  InternalServerErrorException,
  Res
} from '@nestjs/common';
import { Response } from 'express';
import { UploadsService } from './uploads.service';

/**
 * Controlador Público para Plantillas
 * 
 * Endpoints sin autenticación para descargar plantillas Excel
 */
@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly uploadsService: UploadsService
  ) {}

  /**
   * Obtener información de plantillas disponibles (PÚBLICO)
   * 
   * @returns Lista de plantillas con metadatos
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getTemplates(): Promise<any> {
    try {
      return await this.uploadsService.getAvailableTemplates();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error obteniendo plantillas: ${error.message}`
      );
    }
  }

  /**
   * Descargar plantilla específica (PÚBLICO)
   * 
   * @param templateType Tipo de plantilla (academic-structures, teachers, payment-codes, course-reports)
   * @returns Archivo Excel de plantilla
   */
  @Get(':templateType')
  @HttpCode(HttpStatus.OK)
  async downloadTemplate(
    @Param('templateType') templateType: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      const template = await this.uploadsService.generateTemplate(templateType);
      
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="plantilla_${templateType}.xlsx"`,
        'Content-Length': template.length.toString()
      });
      
      res.send(template);
    } catch (error) {
      throw new BadRequestException(
        `Error generando plantilla ${templateType}: ${error.message}`
      );
    }
  }
}
