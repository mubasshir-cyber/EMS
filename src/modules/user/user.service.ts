import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ILike, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { PaginationDto } from '../project/dto/pagination.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) {}

  async updateHashedreFreshToken(
    userId: string,
    hashedRefreshToken: string | null,
  ) {
    return await this.repo.update({ id: userId }, { hashedRefreshToken });
  }

  async create(dto: CreateUserDto) {
    const roleName = (dto.role || 'employee').toLowerCase();
    const role = await this.roleRepo.findOne({
      where: { name: roleName },
    });

    if (!role) {
      throw new NotFoundException(`Role '${roleName}' not found`);
    }

    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.repo.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const user = this.repo.create({
      ...dto,
      email,
      role,
    });

    const savedUser = await this.repo.save(user);

    return this.repo.findOne({
      where: { id: savedUser.id },
      relations: ['role'],
    });
  }

  async findAll(pagination?: PaginationDto) {
    const page = pagination?.page ?? 1;
    const limit = Math.min(pagination?.limit ?? 10, 50); // prevent abuse

    const [employee, total] = await this.repo.findAndCount({
      relations: ['role'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }, // optional but recommended
    });

    return {
      employee,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByEmail(email: string) {
    return await this.repo.findOne({
      where: {
        email: ILike(email),
      },
      relations: ['role'],
    });
  }

  async findProfile(id: string) {
    return await this.repo.findOne({
      where: { id },
      relations: ['role'],
    });
  }

  async findOne(id: string) {
    const user = await this.repo.findOne({
      where: { id },
      relations: ['role'],
      select: ['id', 'first_name', 'last_name', 'email', 'hashedRefreshToken'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      hashedRefreshToken: user.hashedRefreshToken,
      role: user.role,
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.repo.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // first_name
    if (dto.first_name) {
      user.first_name = dto.first_name.trim();
    }

    // last_name
    if (dto.last_name) {
      user.last_name = dto.last_name.trim();
    }

    // mobile
    if (dto.mobile) {
      user.mobile = dto.mobile.trim();
    }

    // email
    if (dto.email) {
      user.email = dto.email.toLowerCase().trim();
    }

    // password
    if (dto.password) {
      user.password = dto.password;
      // BeforeUpdate hook will hash it
    }

    // role
    if (dto.role && user.role?.name !== dto.role.toLowerCase()) {
      const role = await this.roleRepo.findOne({
        where: { name: dto.role.toLowerCase() },
      });

      if (!role) {
        throw new BadRequestException('Invalid role');
      }

      user.role = role;
    }

    // last login
    if (dto.lastLoginAt) {
      user.lastLoginAt = dto.lastLoginAt;
    }

    return await this.repo.save(user);
  }

  async remove(id: string) {
    const user = await this.repo.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.repo.remove(user);

    return {
      message: 'User deleted successfully',
    };
  }

  async updateLastLogin(userId: string) {
    await this.repo.update(userId, {
      lastLoginAt: new Date(),
    });
  }
}
