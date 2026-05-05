import { UserService } from '../user/user.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
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

  async create(createStandupDto: CreateStandupDto) {
    const { userId, date } = createStandupDto;

    // 1️⃣ Validate user
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2️⃣ Prevent duplicate standup
    const existing = await this.standupRepo.findOne({
      where: { userId, date },
    });

    if (existing) {
      throw new BadRequestException('Standup already submitted for this date');
    }

    // 3️⃣ Create standup
    const standup = this.standupRepo.create({
      ...createStandupDto,
      userId,
    });

    // 4️⃣ Save
    const saved = await this.standupRepo.save(standup);

    return saved;
  }

  async findAll(query: {
    userId?: string;
    date?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);

    const qb = this.standupRepo
      .createQueryBuilder('standup')
      .leftJoinAndSelect('standup.user', 'user')
      .orderBy('standup.createdAt', 'DESC');

    // ✅ Filter by userId
    if (query.userId) {
      qb.andWhere('standup.userId = :userId', {
        userId: query.userId,
      });
    }

    // ✅ Filter by date
    if (query.date) {
      qb.andWhere('standup.date = :date', {
        date: query.date,
      });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map((s) => this.mapStandup(s)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const standup = await this.standupRepo
      .createQueryBuilder('standup')
      .leftJoinAndSelect('standup.user', 'user')
      .where('standup.id = :id', { id })
      .getOne();

    if (!standup) {
      throw new NotFoundException('Standup not found');
    }

    return this.mapStandup(standup);
  }

  async update(id: string, dto: UpdateStandupDto) {
    const standup = await this.standupRepo.findOne({
      where: { id },
    });

    if (!standup) {
      throw new NotFoundException('Standup not found');
    }

    // ❗ Prevent changing userId + date (important)
    if (dto.userId || dto.date) {
      throw new BadRequestException('userId and date cannot be updated');
    }

    // ✅ Update fields
    standup.yesterdayWork = dto.yesterdayWork ?? standup.yesterdayWork;

    standup.todayWork = dto.todayWork ?? standup.todayWork;

    standup.blockers = dto.blockers ?? standup.blockers;

    const saved = await this.standupRepo.save(standup);

    return this.mapStandup(saved);
  }

  async remove(id: string) {
    const standup = await this.standupRepo.findOne({
      where: { id },
    });

    if (!standup) {
      throw new NotFoundException('Standup not found');
    }

    await this.standupRepo.remove(standup);

    return {
      message: 'Standup deleted successfully',
    };
  }

  private mapStandup(standup: Standup) {
    return {
      id: standup.id,
      date: standup.date,
      yesterdayWork: standup.yesterdayWork,
      todayWork: standup.todayWork,
      blockers: standup.blockers,
      createdAt: standup.createdAt,

      user: {
        id: standup.user?.id,
        name: `${standup.user?.first_name} ${standup.user?.last_name}`,
        email: standup.user?.email,
      },
    };
  }
}
