import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { DropdownService, Subject, Teacher, Room, Plan, Level } from '../services/dropdown.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('dropdown')
export class DropdownController {
  constructor(private readonly dropdownService: DropdownService) {}

  @Get('teachers')
  async getTeachers(@Query('bimestreId') bimestreId?: string): Promise<Teacher[]> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.dropdownService.getTeachers(bimestreIdNum);
  }

  @Get('subjects')
  async getSubjects(@Query('bimestreId') bimestreId?: string): Promise<Subject[]> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.dropdownService.getSubjects(bimestreIdNum);
  }

  @Get('rooms')
  async getRooms(): Promise<Room[]> {
    return this.dropdownService.getRooms();
  }

  @Get('plans')
  async getPlans(@Query('bimestreId') bimestreId?: string): Promise<Plan[]> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.dropdownService.getPlans(bimestreIdNum);
  }

  @Get('levels')
  async getLevels(@Query('bimestreId') bimestreId?: string): Promise<Level[]> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.dropdownService.getLevels(bimestreIdNum);
  }

  // Endpoints para datos de "Inicio" desde vacantes_inicio_permanente
  @Get('plans-inicio')
  async getPlansInicio(@Query('bimestreId') bimestreId?: string): Promise<Plan[]> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.dropdownService.getPlansInicio(bimestreIdNum);
  }

  @Get('levels-inicio')
  async getLevelsInicio(@Query('bimestreId') bimestreId?: string): Promise<Level[]> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.dropdownService.getLevelsInicio(bimestreIdNum);
  }

  @Get('subjects-inicio')
  async getSubjectsInicio(@Query('bimestreId') bimestreId?: string): Promise<Subject[]> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.dropdownService.getSubjectsInicio(bimestreIdNum);
  }

  // Endpoints para asignaturas filtradas por permisos del usuario
  @Get('subjects-with-permissions')
  @UseGuards(JwtAuthGuard)
  async getSubjectsWithPermissions(
    @Req() req: any,
    @Query('bimestreId') bimestreId?: string
  ): Promise<Subject[]> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    const userId = req.user.userId;
    return this.dropdownService.getSubjectsWithPermissions(userId, bimestreIdNum);
  }

  @Get('subjects-inicio-with-permissions')
  @UseGuards(JwtAuthGuard)
  async getSubjectsInicioWithPermissions(
    @Req() req: any,
    @Query('bimestreId') bimestreId?: string
  ): Promise<Subject[]> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    const userId = req.user.userId;
    return this.dropdownService.getSubjectsInicioWithPermissions(userId, bimestreIdNum);
  }
}