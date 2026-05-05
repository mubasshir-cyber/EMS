import { Module } from '@nestjs/common';
import { StandupsService } from './standups.service';
import { StandupsController } from './standups.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Standup } from './entities/standup.entity';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Standup, User]), UserModule],
  controllers: [StandupsController],
  providers: [StandupsService],
  exports: [StandupsService],
})
export class StandupsModule {}
