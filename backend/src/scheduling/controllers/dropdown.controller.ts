import { Controller, Get } from '@nestjs/common';
import { DropdownService, Teacher, Subject, Room } from '../services/dropdown.service';

@Controller('dropdowns')
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
}