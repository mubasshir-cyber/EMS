import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { CorrectionRequestDto } from '../dto/correction-request.dto';
import { Correction } from '../entities/correction.entity';
import { Attendance } from '../entities/attendance.entity';
import { CorrectionStatus } from 'src/common/enums/CorrectionStatus.enum';
import { AttendanceStatus } from 'src/common/enums/AttendanceStatus.enum';

dayjs.extend(isBetween);

@Injectable()
export class CorrectionService {
  constructor(
    @InjectRepository(Correction)
    private correctionRepo: Repository<Correction>,

    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    private dataSource: DataSource,
  ) {}

  async requestCorrection(userId: string, dto: CorrectionRequestDto) {
    const attendance = await this.attendanceRepo.findOne({
      where: { userId, date: dto.date },
    });

    if (!attendance) {
      throw new BadRequestException('Attendance not found');
    }

    // 🚫 prevent duplicate pending requests
    const existing = await this.correctionRepo.findOne({
      where: {
        userId,
        attendanceId: attendance.id,
        status: CorrectionStatus.PENDING,
      },
    });

    if (existing) {
      throw new BadRequestException('Correction already requested');
    }

    return this.correctionRepo.save({
      userId,
      attendanceId: attendance.id,

      requestedCheckIn: dto.requestedCheckIn,
      requestedCheckOut: dto.requestedCheckOut,
      reason: dto.reason,

      status: CorrectionStatus.PENDING,
    });
  }

  private calculateStatus(checkIn: Date): AttendanceStatus {
    const time = dayjs(checkIn);

    const presentStart = time.startOf('day').hour(10).minute(30).second(0);
    const presentEnd = time.startOf('day').hour(11).minute(0).second(0);
    const lateEnd = time.startOf('day').hour(12).minute(30).second(0);

    if (time.isBefore(presentStart)) return AttendanceStatus.PRESENT;

    if (time.isBetween(presentStart, presentEnd, null, '[)')) {
      return AttendanceStatus.PRESENT;
    }

    if (time.isBetween(presentEnd, lateEnd, null, '[)')) {
      return AttendanceStatus.LATE;
    }

    return AttendanceStatus.HALF_DAY;
  }

  // ✅ UPDATED REVIEW METHOD
  async review(id: string, status: CorrectionStatus, reviewerId: string) {
    return this.dataSource.transaction(async (manager) => {
      const correction = await manager.findOne(Correction, {
        where: { id },
      });

      if (!correction) {
        throw new BadRequestException('Not found');
      }

      if (correction.status !== CorrectionStatus.PENDING) {
        throw new BadRequestException('Already reviewed');
      }

      correction.status = status;
      correction.reviewedBy = reviewerId;
      correction.createdAt = new Date(); // ✅ audit field

      let updatedAttendance: Attendance | null = null;

      if (status === CorrectionStatus.APPROVED) {
        const attendance = await manager.findOne(Attendance, {
          where: { id: correction.attendanceId },
          lock: { mode: 'pessimistic_write' }, // ✅ prevent race condition
        });

        if (!attendance) {
          throw new BadRequestException('Attendance not found');
        }

        // ✅ Apply corrected times
        if (correction.requestedCheckIn) {
          attendance.checkIn = new Date(correction.requestedCheckIn);
        }

        if (correction.requestedCheckOut) {
          attendance.checkOut = new Date(correction.requestedCheckOut);
        }

        // ✅ Apply corrected reason (IMPORTANT FIX)
        if (correction.reason) {
          attendance.earlyCheckoutReason = correction.reason;
        }

        // ❌ Invalid time check
        if (
          attendance.checkIn &&
          attendance.checkOut &&
          attendance.checkIn > attendance.checkOut
        ) {
          throw new BadRequestException('Invalid time range');
        }

        // ✅ Recalculate overtime + status (FULL FIX)
        if (attendance.checkIn && attendance.checkOut) {
          const workedMinutes =
            (attendance.checkOut.getTime() - attendance.checkIn.getTime()) /
            60000;

          // ⏱️ Overtime
          attendance.overtimeMinutes =
            workedMinutes > 480 ? workedMinutes - 480 : 0;

          // 📊 Status logic
          if (workedMinutes < 240) {
            attendance.status = AttendanceStatus.HALF_DAY;
          } else {
            attendance.status = this.calculateStatus(attendance.checkIn);
          }
        }

        // 💾 Save attendance
        updatedAttendance = await manager.save(attendance, {
          reload: true,
        });
      }

      const updatedCorrection = await manager.save(correction, {
        reload: true,
      });

      return {
        correction: updatedCorrection,
        attendance: updatedAttendance,
      };
    });
  }
}
