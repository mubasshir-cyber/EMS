import { CorrectionService } from './../services/correction.service';
import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';

import { AttendanceService } from '../services/attendance.service';
import { CheckInDto } from '../dto/check-In.dto';
import { CheckOutDto } from '../dto/check-out.dto';

import { CorrectionRequestDto } from '../dto/correction-request.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private correctionService: CorrectionService,
  ) {}

  // @UseGuards(JwtAuthGuard)
  @Post('check-in')
  checkIn(@Req() req, @Body() dto: CheckInDto) {
    return this.attendanceService.checkIn(req.user.id, dto.location);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('check-out')
  checkOut(@Req() req, @Body() dto: CheckOutDto) {
    return this.attendanceService.checkOut(req.user.id,
      dto.location,
      dto.earlyCheckoutReason);
  }

  @Get('me')
  getMy(@Req() req) {
    return this.attendanceService.getMyAttendance(req.user.id);
  }

  @Post('correction-request')
  requestCorrection(@Req() req, @Body() dto: CorrectionRequestDto) {
    return this.correctionService.requestCorrection(req.user.id, dto);
  }
}
