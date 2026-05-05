import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { nowIST, todayIST, formatIST } from 'src/utils/time.util';
import dayjs from 'dayjs';
import { Cron } from '@nestjs/schedule';
import { Attendance } from '../entities/attendance.entity';
import { AttendanceStatus } from '../../../common/enums/AttendanceStatus.enum';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    private dataSource: DataSource,
  ) {}

  // ✅ CHECK-IN (transaction safe + time range logic + FIXED locking)
  async checkIn(userId: string, location?: string) {
    return this.dataSource.transaction(async (manager) => {
      const today = todayIST();
      const now = nowIST();
      const nowDate = now.toDate();

      // 🔒 STEP 1: LOCK ONLY BASE ENTITY (NO RELATIONS)
      let attendance = await manager.findOne(Attendance, {
        where: { userId, date: today },
        lock: { mode: 'pessimistic_write' },
      });

      if (attendance?.checkIn) {
        throw new BadRequestException('Already checked in');
      }

      if (!attendance) {
        attendance = manager.create(Attendance, {
          userId,
          date: today,
        });
      }

      attendance.checkIn = nowDate;
      attendance.checkInLocation = location;

      // ⏱️ Time ranges (IST)
      const presentStart = now.startOf('day').hour(10).minute(30).second(0);
      const presentEnd = now.startOf('day').hour(11).minute(0).second(0);
      const lateEnd = now.startOf('day').hour(12).minute(30).second(0);

      if (now.isBefore(presentStart)) {
        attendance.status = AttendanceStatus.PRESENT;
      } else if (now.isBetween(presentStart, presentEnd, null, '[)')) {
        attendance.status = AttendanceStatus.PRESENT;
      } else if (now.isBetween(presentEnd, lateEnd, null, '[)')) {
        attendance.status = AttendanceStatus.LATE;
      } else {
        attendance.status = AttendanceStatus.HALF_DAY;
      }

      // 💾 Save
      const saved = await manager.save(attendance, { reload: true });

      // 🔁 STEP 2: FETCH RELATIONS SEPARATELY (NO LOCK)
      const fullAttendance = await manager.findOne(Attendance, {
        where: { id: saved.id },
        // relations: ['user'],
      });

      // return this.formatResponse(fullAttendance);
      return this.formatResponse(fullAttendance ?? saved);
    });
  }

  // auto checkout
  // 8:00 PM IST (adjust if server not IST)
  @Cron('0 22 * * *', { timeZone: 'Asia/Kolkata' })
  async autoCheckOut() {
    const today = todayIST();

    const autoCheckoutTime = nowIST()
      .hour(22)
      .minute(0)
      .second(0)
      .millisecond(0)
      .toDate();

    await this.dataSource.transaction(async (manager) => {
      const records = await manager
        .createQueryBuilder(Attendance, 'attendance')
        .setLock('pessimistic_write') // ✅ real lock
        .where('attendance.date = :today', { today })
        .andWhere('attendance.checkOut IS NULL')
        .getMany();

      for (const attendance of records) {
        if (!attendance.checkIn) continue;

        attendance.checkOut = autoCheckoutTime;
        attendance.checkOutLocation = 'AUTO';

        if (!attendance.earlyCheckoutReason) {
          attendance.earlyCheckoutReason = 'Auto checkout (forgot)';
        }

        const workedMinutes =
          (attendance.checkOut.getTime() - attendance.checkIn.getTime()) /
          60000;

        attendance.overtimeMinutes =
          workedMinutes > 480 ? workedMinutes - 480 : 0;

        attendance.isAutoCheckout = true; // ✅ you forgot this

        await manager.save(attendance);
      }
    });
  }

  // ✅ CHECK-OUT (transaction safe + IST consistent)
  // ✅ CHECK-OUT with work-hour logic
  async checkOut(userId: string, location?: string, reason?: string) {
    return this.dataSource.transaction(async (manager) => {
      const today = todayIST();
      const now = nowIST();
      const nowDate = now.toDate();

      // 🔒 STEP 1: LOCK ONLY BASE ENTITY
      const attendance = await manager.findOne(Attendance, {
        where: { userId, date: today },
        lock: { mode: 'pessimistic_write' },
      });

      if (!attendance || !attendance.checkIn) {
        throw new BadRequestException('Check-in not found');
      }

      if (attendance.checkOut) {
        throw new BadRequestException('Already checked out');
      }

      // ⏱️ Calculate worked hours
      const checkInTime = dayjs(attendance.checkIn);
      const workedMinutes = now.diff(checkInTime, 'minute');
      const workedHours = workedMinutes / 60;

      let message: string | null = null;

      // ❌ Early checkout → require reason
      if (workedHours < 8) {
        if (!reason) {
          throw new BadRequestException(
            'Working hours not completed. Please provide reason for early checkout.',
          );
        }

        attendance.earlyCheckoutReason = reason;
        message = 'Early checkout recorded';
      }

      // ✅ Completed 8 hours
      if (workedHours >= 8) {
        message = 'Working hours completed. You may check out.';
      }

      // ⏱️ Overtime
      let overtimeMinutes = 0;
      if (workedHours > 8) {
        overtimeMinutes = workedMinutes - 8 * 60;
      }

      attendance.checkOut = nowDate;
      attendance.checkOutLocation = location;
      attendance.overtimeMinutes = overtimeMinutes;

      const saved = await manager.save(attendance, { reload: true });

      // 🔁 STEP 2: FETCH RELATION SEPARATELY
      const fullAttendance = await manager.findOne(Attendance, {
        where: { id: saved.id },
        // relations: ['user'],
      });

      return {
        ...this.formatResponse(fullAttendance ?? saved),

        workedHours: Number(workedHours.toFixed(2)),
        overtimeMinutes,
        message,
      };
    });
  }

  // ✅ MY ATTENDANCE (clean + reusable formatting)
  async getMyAttendance(userId: string) {
    const data = await this.attendanceRepo.find({
      where: { userId },
      order: { date: 'DESC' },
    });

    return data.map((item) => this.formatResponse(item));
  }

  // ✅ FILTERED QUERY (with user join + pagination + formatting)
  async getFilteredAttendance(query: any) {
    const { date, month, year, employeeId, page = 1, limit = 10 } = query;

    const qb = this.attendanceRepo.createQueryBuilder('attendance');

    // ✅ JOIN USER (important)
    qb.leftJoinAndSelect('attendance.user', 'user');

    if (employeeId) {
      qb.andWhere('attendance.userId = :employeeId', { employeeId });
    }

    if (date) {
      qb.andWhere('attendance.date = :date', { date });
    }

    if (month && year) {
      qb.andWhere(
        'EXTRACT(MONTH FROM attendance.date) = :month AND EXTRACT(YEAR FROM attendance.date) = :year',
        { month, year },
      );
    }

    qb.orderBy('attendance.date', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, count] = await qb.getManyAndCount();

    return {
      data: data.map((item) => this.formatResponse(item)),
      total: count,
      page: Number(page),
      limit: Number(limit),
    };
  }
  // ✅ Centralized response formatter
  private formatResponse(attendance: Attendance) {
    return {
      ...attendance,
      checkIn: formatIST(attendance.checkIn),
      checkOut: formatIST(attendance.checkOut),
    };
  }
}
