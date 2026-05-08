import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { User } from '../user/entities/user.entity';
import { Project } from '../project/entities/project.entity';
import { Task } from '../task/entities/task.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Standup } from '../standups/entities/standup.entity';

import { TaskStatus } from '../../common/enums/task-status.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Project)
    private projectRepo: Repository<Project>,

    @InjectRepository(Task)
    private taskRepo: Repository<Task>,

    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,

    @InjectRepository(Standup)
    private standupRepo: Repository<Standup>,
  ) {}

  private isEmployee(user: any): boolean {
    return user?.role === 'employee' || user?.role?.name === 'employee';
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private validateProductivityAccess(employeeId: string, user: any) {
    // Employee can only view own report
    if (this.isEmployee(user) && employeeId !== user.id) {
      throw new ForbiddenException(
        'You can only view your own productivity report',
      );
    }
  }

  private async findUserOrFail(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private countTaskStatuses(tasks: Task[]) {
    return {
      inProgress: tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS)
        .length,

      inReview: tasks.filter((task) => task.status === TaskStatus.IN_REVIEW)
        .length,

      completed: tasks.filter((task) => task.status === TaskStatus.COMPLETED)
        .length,

      critical: tasks.filter((task) => task.status === TaskStatus.CRITICAL)
        .length,
    };
  }

  private calculatePercentage(value: number, total: number): string {
    if (!total) return '0%';

    return `${Math.round((value / total) * 100)}%`;
  }

  private mapProductivityReport(user: User, data: any) {
    return {
      employee: {
        id: user.id,

        name: `${user.first_name} ${user.last_name}`,

        email: user.email,
      },

      attendanceRate: data.attendanceRate,

      tasks: {
        assigned: data.assignedTasks,

        completed: data.completedTasks,

        pending: data.pendingTasks,
      },

      standupsSubmitted: data.standupsSubmitted,
    };
  }

  async getDashboard(user: any) {
    // 1️⃣ Today's date
    const today = this.getTodayDate();

    // 2️⃣ Total employees
    const totalEmployees = await this.userRepo.count();

    // 3️⃣ Total projects
    const totalProjects = await this.projectRepo.count();

    // 4️⃣ Fetch all tasks
    const tasks = await this.taskRepo.find();

    // 5️⃣ Total tasks
    const totalTasks = tasks.length;

    // 6️⃣ Task statistics
    const taskStats = this.countTaskStatuses(tasks);

    // 7️⃣ Attendance today
    const attendanceToday = await this.attendanceRepo
      .createQueryBuilder('attendance')

      .where('attendance.date = :today', { today })

      .getMany();

    // 8️⃣ Present employees
    const present = attendanceToday.filter((a) => a.checkIn).length;

    // 9️⃣ Absent employees
    const absent = totalEmployees - present;

    // 🔟 Standups today
    const standupsToday = await this.standupRepo.count({
      where: {
        date: today,
      },
    });

    // 1️⃣1️⃣ Return dashboard
    return {
      totalEmployees,

      totalProjects,

      totalTasks,

      taskStats,

      attendanceToday: {
        present,
        absent,
      },

      standupsToday,
    };
  }




  async getProductivity(
  employeeId: string,
  user: any,
) {

  // 1️⃣ Validate access
  this.validateProductivityAccess(
    employeeId,
    user,
  );

  // 2️⃣ Find employee
  const employee =
    await this.findUserOrFail(
      employeeId,
    );

  // 3️⃣ Fetch employee tasks
  const tasks =
    await this.taskRepo
      .createQueryBuilder('task')
      .leftJoin(
        'task.assignees',
        'user',
      )

      .where(
        'user.id = :employeeId',
        { employeeId },
      )

      .getMany();

  // 4️⃣ Task counts
  const assignedTasks =
    tasks.length;

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status ===
        TaskStatus.COMPLETED,
    ).length;

  const pendingTasks =
    assignedTasks -
    completedTasks;

  // 5️⃣ Employee attendance
  const attendances =
    await this.attendanceRepo.find({
      where: {
        userId: employeeId,
      },
    });

  // 6️⃣ Present count
  const presentDays =
    attendances.filter(
      (a) => a.checkIn,
    ).length;

  // 7️⃣ Attendance rate
  const attendanceRate =
    this.calculatePercentage(
      presentDays,
      attendances.length,
    );

  // 8️⃣ Standups submitted
  const standupsSubmitted =
    await this.standupRepo.count({
      where: {
        userId: employeeId,
      },
    });

  // 9️⃣ Return formatted response
  return this.mapProductivityReport(
    employee,
    {
      attendanceRate,

      assignedTasks,

      completedTasks,

      pendingTasks,

      standupsSubmitted,
    },
  );
}
}
