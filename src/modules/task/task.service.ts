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

  private parseDate(date?: string): Date | null {
    if (!date) return null;

    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid date: ${date}`);
    }

    return parsed;
  }

  async create(dto: CreateTaskDto) {
    // 1️⃣ Validate dates
    if (dto.startTaskDate && dto.endTaskDate) {
      if (new Date(dto.startTaskDate) > new Date(dto.endTaskDate)) {
        throw new BadRequestException(
          'startTaskDate must be before endTaskDate',
        );
      }
    }

    // 2️⃣ Get project with team
    const project = await this.projectRepo.findOne({
      where: { id: dto.projectId },
      relations: ['team'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 3️⃣ Normalize + deduplicate
    const uuidRegex = /^[0-9a-f-]{36}$/i;

    const normalizedAssignees = [
      ...new Set(
        dto.assignees.map((item) =>
          uuidRegex.test(item.trim()) ? item.trim() : item.trim().toLowerCase(),
        ),
      ),
    ];

    // 4️⃣ Resolve users
    const users = await this.projectSer.resolveUsers(normalizedAssignees);

    // 5️⃣ Validate users belong to project team
    const teamIds = project.team.map((u) => u.id);

    const invalidUsers = users.filter((user) => !teamIds.includes(user.id));

    if (invalidUsers.length > 0) {
      throw new BadRequestException(
        `These users are not part of the project team: ${invalidUsers
          .map((u) => u.email)
          .join(', ')}`,
      );
    }

    // 6️⃣ Create task
    const task = this.taskRepo.create({
      title: dto.title,
      description: dto.description,
      status: dto.status ?? TaskStatus.IN_PROGRESS,
      startTaskDate: this.parseDate(dto.startTaskDate),
      endTaskDate: this.parseDate(dto.endTaskDate),
      project,
      assignees: users,
    } as DeepPartial<Task>);

    // 7️⃣ Save
    const saved = await this.taskRepo.save(task);

    return this.findOne(saved.id);
  }

  async findAll(page = 1, limit = 10) {
    const [tasks, total] = await this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignees', 'user')
      .leftJoinAndSelect('user.role', 'role')
      .orderBy('task.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

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

  async findOne(id: string) {
    const task = await this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignees', 'user')
      .leftJoinAndSelect('user.role', 'role')
      .where('task.id = :id', { id })
      .getOne();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.mapTask(task);
  }

  async update(id: string, dto: UpdateTaskDto) {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['project', 'project.team', 'assignees'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // ✅ Validate dates
    const startDate = dto.startTaskDate
      ? this.parseDate(dto.startTaskDate)
      : task.startTaskDate;

    const endDate = dto.endTaskDate
      ? this.parseDate(dto.endTaskDate)
      : task.endTaskDate;

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('startTaskDate must be before endTaskDate');
    }

    // ✅ Update assignees if provided
    if (dto.assignees !== undefined) {
      const uniqueAssignees = [...new Set(dto.assignees)];
      const users = await this.projectSer.resolveUsers(uniqueAssignees);

      const teamIds = task.project.team.map((u) => u.id);

      const invalidUsers = users.filter((user) => !teamIds.includes(user.id));

      if (invalidUsers.length > 0) {
        throw new BadRequestException(
          `Invalid assignees: ${invalidUsers.map((u) => u.email).join(', ')}`,
        );
      }

      task.assignees = users;
    }

    // ✅ Update fields
    task.title = dto.title ?? task.title;
    task.description = dto.description ?? task.description;
    task.status = dto.status ?? task.status;
    task.startTaskDate = startDate ?? undefined;
    task.endTaskDate = endDate ?? undefined;

    const saved = await this.taskRepo.save(task);

    return this.findOne(saved.id);
  }

  async remove(id: string) {
    const task = await this.taskRepo.findOne({ where: { id } });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.taskRepo.remove(task);

    return {
      message: 'Task deleted successfully',
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

      assignees: task.assignees?.map((user) => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role?.name,
      })),
    };
  }
}
