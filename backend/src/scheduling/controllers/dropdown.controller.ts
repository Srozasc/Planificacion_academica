import { Controller, Get } from '@nestjs/common';
import { DropdownService, Subject, Teacher, Room, Plan, Level } from '../services/dropdown.service';

@Controller('dropdown')
export class DropdownController {
  constructor(private readonly dropdownService: DropdownService) {}

  @Get('teachers')
  async getTeachers(): Promise<Teacher[]> {
    return this.dropdownService.getTeachers();
  }

  @Get('subjects')
  async getSubjects(): Promise<Subject[]> {
    return this.dropdownService.getSubjects();
  }

  @Get('rooms')
  async getRooms(): Promise<Room[]> {
    return this.dropdownService.getRooms();
  }

  @Get('plans')
  async getPlans(): Promise<Plan[]> {
    return this.dropdownService.getPlans();
  }

  @Get('levels')
  async getLevels(): Promise<Level[]> {
    return this.dropdownService.getLevels();
  }
}