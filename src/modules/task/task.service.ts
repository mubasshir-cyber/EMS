import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Project } from '../project/entities/project.entity';
import { TaskStatus } from 'src/common/enums/task-status.enum';
import { User } from '../user/entities/user.entity';
import { DeepPartial } from 'typeorm';
import { ProjectService } from '../project/project.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,

    @InjectRepository(Project)
    private projectRepo: Repository<Project>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private projectSer: ProjectService,
  ) {}

  private isUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return uuidRegex.test(value);
  }

  private isEmployee(user: any): boolean {
    return user?.role === 'employee' || user?.role?.name === 'employee';
  }

  private parseDate(date?: string): Date | undefined {
    if (!date) return undefined;

    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid date: ${date}`);
    }

    return parsed;
  }

  private validateDateRange(
    startDate?: string,
    endDate?: string,
    startLabel = 'startDate',
    endLabel = 'endDate',
  ) {
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        throw new BadRequestException(
          `${startLabel} must be before ${endLabel}`,
        );
      }
    }
  }

  private normalizeIdentifiers(values: string[]) {
    return [
      ...new Set(
        values.map((item) =>
          this.isUUID(item.trim()) ? item.trim() : item.trim().toLowerCase(),
        ),
      ),
    ];
  }

  private async findProjectOrFail(identifier: string, user?: any) {
    const query = this.projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.team', 'team');

    if (this.isUUID(identifier)) {
      query.where('project.id = :identifier', {
        identifier,
      });
    } else {
      query.where('LOWER(project.project_name) = LOWER(:identifier)', {
        identifier,
      });
    }

    if (user && this.isEmployee(user)) {
      query.andWhere('team.id = :userId', {
        userId: user.id,
      });
    }

    const project = await query.getOne();

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    return project;
  }

  private buildTaskQuery() {
    return this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignees', 'user')
      .leftJoinAndSelect('user.role', 'role');
  }

  private async validateProjectAssignees(
    assignees: string[],
    project: Project,
  ) {
    const normalized = this.normalizeIdentifiers(assignees);

    const users = await this.projectSer.resolveUsers(normalized);

    const teamIds = project.team.map((user) => user.id);

    const invalidUsers = users.filter((user) => !teamIds.includes(user.id));

    if (invalidUsers.length > 0) {
      throw new BadRequestException(
        `These users are not part of the project team: ${invalidUsers
          .map((u) => u.email)
          .join(', ')}`,
      );
    }

    return users;
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

  private mapTask(task: Task) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,

      startTaskDate: task.startTaskDate,
      endTaskDate: task.endTaskDate,

      createdAt: task.createdAt,
      updatedAt: task.updatedAt,

      project: {
        id: task.project?.id,
        name: task.project?.project_name,
      },

      assignees:
        task.assignees?.map((user) => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role?.name,
        })) || [],
    };
  }

  async create(dto: CreateTaskDto) {
    this.validateDateRange(
      dto.startTaskDate,
      dto.endTaskDate,
      'startTaskDate',
      'endTaskDate',
    );

    const project = await this.findProjectOrFail(dto.projectId);

    const users = await this.validateProjectAssignees(dto.assignees, project);

    const task = this.taskRepo.create({
      title: dto.title,
      description: dto.description,
      status: dto.status ?? TaskStatus.IN_PROGRESS,
      startTaskDate: this.parseDate(dto.startTaskDate),
      endTaskDate: this.parseDate(dto.endTaskDate),
      project,
      assignees: users,
    } as DeepPartial<Task>);
    const saved: Task = await this.taskRepo.save(task);
    return this.findOne(saved.id);
  }

  async findAll(page = 1, limit = 10, user: any) {
    limit = Math.min(limit, 50);

    const query = this.buildTaskQuery();

    if (this.isEmployee(user)) {
      query.andWhere('user.id = :userId', {
        userId: user.id,
      });
    }

    query
      .orderBy('task.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [tasks, total] = await query.getManyAndCount();

    return {
      data: tasks.map((task) => this.mapTask(task)),

      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user?: any) {
    const query = this.buildTaskQuery();

    query.where('task.id = :id', { id });

    if (user && this.isEmployee(user)) {
      query.andWhere('user.id = :userId', {
        userId: user.id,
      });
    }

    const task = await query.getOne();

    if (!task) {
      throw new NotFoundException('Task not found or access denied');
    }

    return this.mapTask(task);
  }

  async findByProject(identifier: string, user: any) {
    const project = await this.findProjectOrFail(identifier, user);

    const query = this.buildTaskQuery();

    query.where('project.id = :projectId', {
      projectId: project.id,
    });

    if (this.isEmployee(user)) {
      query.andWhere('user.id = :userId', {
        userId: user.id,
      });
    }

    const tasks = await query.orderBy('task.createdAt', 'DESC').getMany();

    if (tasks.length === 0) {
      throw new NotFoundException(
        'No tasks have been created for this project yet',
      );
    }

    const taskStats = this.countTaskStatuses(tasks);

    return {
      project: {
        id: project.id,
        name: project.project_name,
      },

      totalTasks: tasks.length,

      taskStats,

      tasks: tasks.map((task) => this.mapTask(task)),
    };
  }

  async update(id: string, dto: UpdateTaskDto) {
    const task = await this.taskRepo.findOne({
      where: { id },

      relations: ['project', 'project.team', 'assignees'],
    });

    // 2️⃣ Task not found
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    this.validateDateRange(
      dto.startTaskDate ?? task.startTaskDate?.toISOString(),

      dto.endTaskDate ?? task.endTaskDate?.toISOString(),

      'startTaskDate',
      'endTaskDate',
    );

    if (dto.assignees !== undefined) {
      const users = await this.validateProjectAssignees(
        dto.assignees,
        task.project,
      );

      task.assignees = users;
    }

    task.title = dto.title ?? task.title;

    task.description = dto.description ?? task.description;

    task.status = dto.status ?? task.status;

    task.startTaskDate = dto.startTaskDate
      ? this.parseDate(dto.startTaskDate)
      : task.startTaskDate;

    task.endTaskDate = dto.endTaskDate
      ? this.parseDate(dto.endTaskDate)
      : task.endTaskDate;

    const saved = await this.taskRepo.save(task);

    return this.findOne(saved.id);
  }

  async remove(id: string) {
    const result = await this.taskRepo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Task not found');
    }

    return {
      message: 'Task deleted successfully',
    };
  }
}
