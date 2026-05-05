import { CorrectionService } from './../services/correction.service';

import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CorrectionRequestDto } from '../dto/correction-request.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('correction')
export class HrAttendanceController {
  constructor(private correctionService: CorrectionService) {}

  @Post('correction-request')
  requestCorrection(@Req() req, @Body() dto: CorrectionRequestDto) {
    return this.correctionService.requestCorrection(req.user.id, dto);
  }
}
