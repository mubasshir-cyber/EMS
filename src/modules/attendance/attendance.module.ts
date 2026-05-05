import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Attendance } from './entities/attendance.entity';
import { AttendanceService } from './services/attendance.service';
import { AttendanceController } from './controllers/attendance.controller';
import { HrAttendanceController } from './controllers/hr-attendance.controller';
import { CorrectionService } from './services/correction.service';
import { Correction } from './entities/correction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, Correction])],
  controllers: [AttendanceController, HrAttendanceController],
  providers: [AttendanceService, CorrectionService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
