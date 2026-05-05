import { Project } from './entities/project.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { In } from 'typeorm';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(dto: CreateProjectDto) {
    this.validateDates(dto.projectStartDate, dto.deadline);
    const users = await this.resolveUsers(dto.team);

    if (!dto.deadline) {
      throw new BadRequestException('Deadline is required');
    }
    const project = this.projectRepo.create({
      project_name: dto.project_name,
      project_description: dto.project_description,
      projectStartDate: dto.projectStartDate
        ? new Date(dto.projectStartDate)
        : null,
      deadline: new Date(dto.deadline),
      team: users,
    });
    const saved = await this.projectRepo.save(project);
    return this.findOne(saved.id);
  }

  // =========================
  // ✅ DATE VALIDATION
  // =========================
  private validateDates(projectStartDate?: string, deadline?: string) {
    if (projectStartDate && deadline) {
      if (new Date(projectStartDate) > new Date(deadline)) {
        throw new BadRequestException(
          'projectStartDate must be before deadline',
        );
      }
    }
  }

  // async findAll(pagination?: PaginationDto) {
  //   const page = pagination?.page ?? 1;
  //   const limit = Math.min(pagination?.limit ?? 10, 50);

  //   const [data, total] = await this.projectRepo.findAndCount({
  //     relations: ['team', 'team.role'],
  //     skip: (page - 1) * limit,
  //     take: limit,
  //     order: { createdAt: 'DESC' },
  //   });

  //   return {
  //     data,
  //     meta: {
  //       total,
  //       page,
  //       limit,
  //       totalPages: Math.ceil(total / limit),
  //     },
  //   };
  // }

  async findAll(pagination?: PaginationDto) {
    const page = pagination?.page ?? 1;
    const limit = Math.min(pagination?.limit ?? 10, 50);

    const [projects, total] = await this.projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.team', 'user')
      .leftJoinAndSelect('user.role', 'role')
      .orderBy('project.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: projects.map((p) => this.mapProject(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private mapProject(project: any) {
    return {
      id: project.id,
      project_name: project.project_name,
      project_description: project.project_description,
      status: project.status,
      projectStartDate: project.projectStartDate,
      deadline: project.deadline,

      team:
        project.team?.map((user) => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role?.name,
        })) || [],
    };
  }

  async getProjectById(id: string) {
    const project = await this.projectRepo
      .createQueryBuilder('project')
      .leftJoin('project.team', 'user')
      .leftJoin('user.role', 'role')
      .select([
        // Project fields
        'project.id',
        'project.project_name',
        'project.project_description',
        'project.status',
        'project.projectStartDate',
        'project.deadline',

        // User fields
        'user.id',
        'user.first_name',
        'user.last_name',
        'user.email',

        // Role field
        'role.name',
      ])
      .where('project.id = :id', { id })
      .getOne();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 🔁 Mapping (very important step)
    return this.mapProject(project);
  }

  async findOne(identifier: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    const whereCondition = uuidRegex.test(identifier)
      ? { id: identifier }
      : { project_name: identifier };

    const project = await this.projectRepo.findOne({
      where: whereCondition,
      relations: ['team', 'team.role'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.mapProject(project);
  }

  parseDate(date?: string): Date | undefined {
    if (!date) return undefined;
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid date: ${date}`);
    }
    return parsed;
  }

  async update(id: string, dto: UpdateProjectDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No fields provided for update');
    }
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['team'],
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const startDate =
      this.parseDate(dto.projectStartDate) ?? project.projectStartDate;
    const endDate = this.parseDate(dto.deadline) ?? project.deadline;

    this.validateDates(startDate?.toISOString(), endDate?.toISOString());

    if (dto.team !== undefined) {
      project.team = await this.resolveUsers(dto.team);
    }

    project.project_name = dto.project_name ?? project.project_name;
    project.project_description =
      dto.project_description ?? project.project_description;
    project.projectStartDate = startDate;
    project.deadline = endDate;
    project.status = dto.status ?? project.status;

    return this.projectRepo.save(project);
  }

  async remove(id: string) {
    const result = await this.projectRepo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Project not found');
    }

    return { message: 'Project deleted successfully' };
  }

  async resolveUsers(team: string[]) {
    if (!team || team.length === 0) {
      throw new BadRequestException('Team cannot be empty');
    }
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    const ids: string[] = [];
    const emails: string[] = [];

    for (const item of team) {
      if (uuidRegex.test(item)) {
        ids.push(item);
      } else {
        emails.push(item.toLowerCase());
      }
    }
    const users = await this.userRepo.find({
      where: [
        ...(ids.length ? [{ id: In(ids) }] : []),
        ...(emails.length ? [{ email: In(emails) }] : []),
      ],
      relations: ['role'],
    });
    // Normalize input
    const inputSet = new Set(team.map((i) => i.toLowerCase()));

    // Normalize found users (both id + email)
    const foundSet = new Set<string>();
    for (const user of users) {
      if (user.id) foundSet.add(user.id.toLowerCase());
      if (user.email) foundSet.add(user.email.toLowerCase());
    }
    // Find missing
    const missing = [...inputSet].filter((item) => !foundSet.has(item));
    if (missing.length > 0) {
      throw new BadRequestException(`Users not found: ${missing.join(', ')}`);
    }
    return users;
  }
}
