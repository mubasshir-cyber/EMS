import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

import { User } from '../user/entities/user.entity';
import { Project } from '../project/entities/project.entity';
import { Task } from '../task/entities/task.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Standup } from '../standups/entities/standup.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Project, Task, Attendance, Standup]),
  ],

  controllers: [ReportsController],

  providers: [ReportsService],
})
export class ReportsModule {}
