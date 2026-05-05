import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectService.create(dto);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.projectService.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }
  @Roles('admin', 'manager')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectService.update(id, dto);
  }

  @Roles('admin', 'manager')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }
}
