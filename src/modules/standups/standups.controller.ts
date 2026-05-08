import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { StandupsService } from './standups.service';
import { CreateStandupDto } from './dto/create-standup.dto';
import { UpdateStandupDto } from './dto/update-standup.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('standups')
export class StandupsController {
  constructor(private readonly standupsService: StandupsService) {}

  @Roles('admin', 'manager', 'employee')
  @Post()
  create(@Body() dto: CreateStandupDto, @Req() req) {
    return this.standupsService.create(dto, req.user);
  }

  @Roles('admin', 'manager', 'employee')
  @Get()
  findAll(@Query() query, @Req() req) {
    return this.standupsService.findAll(query, req.user);
  }

  @Roles('admin', 'manager', 'employee')
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.standupsService.findOne(id, req.user);
  }

  @Roles('admin', 'manager', 'employee')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStandupDto, @Req() req) {
    return this.standupsService.update(id, dto, req.user);
  }

  @Roles('admin', 'manager', 'employee')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.standupsService.remove(id, req.user);
  }
}
