import { Controller, Get, Query } from '@nestjs/common';
import { DropdownService, Subject, Teacher, Room, Plan, Level } from '../services/dropdown.service';

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
}