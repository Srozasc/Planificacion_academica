import { Controller, Get, Query, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { TeachersService } from '../services/teachers.service';

@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  /**
   * Obtiene las horas asignadas para un docente específico en un bimestre
   * GET /teachers/assigned-hours?teacherId=123&bimestreId=20
   */
  @Get('assigned-hours')
  async getTeacherAssignedHours(
    @Query('teacherId', ParseIntPipe) teacherId: number,
    @Query('bimestreId', ParseIntPipe) bimestreId: number,
  ): Promise<{ teacherId: number; bimestreId: number; totalHoras: number }> {
    const totalHoras = await this.teachersService.getTeacherAssignedHours(teacherId, bimestreId);
    
    return {
      teacherId,
      bimestreId,
      totalHoras
    };
  }

  /**
   * Obtiene las horas asignadas para múltiples docentes en un bimestre
   * GET /teachers/multiple-assigned-hours?teacherIds=123,456,789&bimestreId=20
   */
  @Get('multiple-assigned-hours')
  async getMultipleTeachersAssignedHours(
    @Query('teacherIds') teacherIdsParam: string,
    @Query('bimestreId', ParseIntPipe) bimestreId: number,
  ): Promise<{ bimestreId: number; teachersHours: Record<number, number> }> {
    if (!teacherIdsParam) {
      throw new BadRequestException('teacherIds parameter is required');
    }

    // Parsear los IDs de docentes desde el string separado por comas
    const teacherIds = teacherIdsParam
      .split(',')
      .map(id => {
        const parsed = parseInt(id.trim(), 10);
        if (isNaN(parsed)) {
          throw new BadRequestException(`Invalid teacher ID: ${id}`);
        }
        return parsed;
      });

    const teachersHours = await this.teachersService.getMultipleTeachersAssignedHours(teacherIds, bimestreId);
    
    return {
      bimestreId,
      teachersHours
    };
  }
}