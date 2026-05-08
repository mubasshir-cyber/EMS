import { UserService } from '../user/user.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStandupDto } from './dto/create-standup.dto';
import { UpdateStandupDto } from './dto/update-standup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Standup } from './entities/standup.entity';

@Injectable()
export class StandupsService {
  constructor(
    @InjectRepository(Standup)
    private standupRepo: Repository<Standup>,
    private userService: UserService,
  ) {}

  private isEmployee(user: any): boolean {
    return user?.role === 'employee' || user?.role?.name === 'employee';
  }

  private buildStandupQuery() {
    return this.standupRepo
      .createQueryBuilder('standup')
      .leftJoinAndSelect('standup.user', 'user');
  }

  private async findStandupOrFail(id: string, user?: any) {
    const query = this.buildStandupQuery();

    // Find standup
    query.where('standup.id = :id', {
      id,
    });

    // Employee restriction
    if (user && this.isEmployee(user)) {
      query.andWhere('standup.userId = :userId', {
        userId: user.id,
      });
    }

    const standup = await query.getOne();

    if (!standup) {
      throw new NotFoundException('Standup not found or access denied');
    }

    return standup;
  }

  private async validateDuplicateStandup(userId: string, date: string) {
    const existing = await this.standupRepo.findOne({
      where: {
        userId,
        date,
      },
    });

    if (existing) {
      throw new BadRequestException('Standup already submitted for this date');
    }
  }

  private async findUserOrFail(userId: string) {
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private mapStandup(standup: Standup) {
    return {
      id: standup.id,

      date: standup.date,

      yesterdayWork: standup.yesterdayWork,

      todayWork: standup.todayWork,

      blockers: standup.blockers,

      createdAt: standup.createdAt,

      updatedAt: standup.updatedAt,

      user: {
        id: standup.user?.id,

        name: `${standup.user?.first_name} ${standup.user?.last_name}`,

        email: standup.user?.email,
      },
    };
  }

  private getPagination(page = 1, limit = 10) {
    const safeLimit = Math.min(limit, 50);

    return {
      page,
      limit: safeLimit,
      skip: (page - 1) * safeLimit,
    };
  }

  async create(dto: CreateStandupDto, user: any) {
    // 1️⃣ Get logged-in user
    const userId = user.id;

    // 2️⃣ Validate user exists
    await this.findUserOrFail(userId);

    // 3️⃣ Prevent duplicate standup
    await this.validateDuplicateStandup(userId, dto.date);

    // 4️⃣ Create standup entity
    const standup = this.standupRepo.create({
      ...dto,
      userId,
    });

    // 5️⃣ Save standup
    const saved = await this.standupRepo.save(standup);

    // 6️⃣ Return formatted response
    return this.findOne(saved.id, user);
  }

  async findAll(
    query: {
      date?: string;
      mine?: string;
      page?: number;
      limit?: number;
    },
    user: any,
  ) {
   
    const { page, limit, skip } = this.getPagination(query.page, query.limit);

    
    const qb = this.buildStandupQuery();

   
    const shouldFilterMine = this.isEmployee(user) || query.mine === 'true';

    if (shouldFilterMine) {
      qb.andWhere('standup.userId = :userId', {
        userId: user.id,
      });
    }

    // 4️⃣ Optional date filter
    if (query.date) {
      qb.andWhere('standup.date = :date', {
        date: query.date,
      });
    }

    
    qb.orderBy('standup.createdAt', 'DESC');

    
    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    // 7️⃣ Return response
    return {
      data: data.map((standup) => this.mapStandup(standup)),

      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async findOne(id: string, user: any) {
    // 1️⃣ Find standup + validate access
    const standup = await this.findStandupOrFail(id, user);

    // 2️⃣ Return formatted response
    return this.mapStandup(standup);
  }

  async update(id: string, dto: UpdateStandupDto, user: any) {
    // 1️⃣ Find standup + validate access
    const standup = await this.findStandupOrFail(id, user);

    // 2️⃣ Prevent updating restricted fields
    if (dto.date !== undefined) {
      throw new BadRequestException('date cannot be updated');
    }

    // 3️⃣ Update editable fields
    standup.yesterdayWork = dto.yesterdayWork ?? standup.yesterdayWork;

    standup.todayWork = dto.todayWork ?? standup.todayWork;

    standup.blockers = dto.blockers ?? standup.blockers;

    // 4️⃣ Save standup
    const saved = await this.standupRepo.save(standup);

    // 5️⃣ Return formatted response
    return this.mapStandup(saved);
  }

  async remove(id: string, user: any) {
    // 1️⃣ Find standup + validate access
    const standup = await this.findStandupOrFail(id, user);

    // 2️⃣ Delete standup
    await this.standupRepo.remove(standup);

    // 3️⃣ Return response
    return {
      message: 'Standup deleted successfully',
    };
  }
}
