import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('schedules')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.schedulingService.findAll(query);
  }

  @Post()
  create(@Body() createEventDto: CreateEventDto) {
    return this.schedulingService.create(createEventDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.schedulingService.update(+id, updateEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.schedulingService.remove(+id);
  }
}
