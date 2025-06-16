import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApproveEventDto } from './dto/approve-event.dto';

@Controller('approval')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get('queue')
  getApprovalQueue(@Query() query: any) {
    return this.approvalService.getApprovalQueue(query);
  }

  @Post('schedules/:eventId/request-review')
  requestReview(@Param('eventId') eventId: string) {
    return this.approvalService.requestReview(+eventId);
  }

  @Post('schedules/:eventId/approve')
  approveEvent(@Param('eventId') eventId: string, @Body() dto: ApproveEventDto) {
    return this.approvalService.approveEvent(+eventId, dto.comment);
  }

  @Post('schedules/:eventId/reject')
  rejectEvent(@Param('eventId') eventId: string, @Body() dto: ApproveEventDto) {
    return this.approvalService.rejectEvent(+eventId, dto.comment);
  }
}
