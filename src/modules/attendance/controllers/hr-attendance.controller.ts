import {
  Controller,
  Get,
  Query,
  Patch,
  Param,
  Req,
  UseGuards,

} from '@nestjs/common';
import { AttendanceService } from '../services/attendance.service';
import { CorrectionService } from '../services/correction.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CorrectionStatus } from '../../../common/enums/CorrectionStatus.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Roles('admin', 'manager')
@Controller('hr/attendance')
export class HrAttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly correctionService: CorrectionService,
  ) {}

  // @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  getAll(@Query() query) {
    return this.attendanceService.getFilteredAttendance(query);
  }

  @Patch('correction/:id/approve')
  approve(@Param('id') id: string, @Req() req) {
    return this.correctionService.review(
      id,
      CorrectionStatus.APPROVED, // ✅ FIX
      req.user.id,
    );
  }

  @Patch('correction/:id/reject')
  reject(@Param('id') id: string, @Req() req) {
    return this.correctionService.review(
      id,
      CorrectionStatus.REJECTED, // ✅ FIX
      req.user.id,
    );
  }
}
