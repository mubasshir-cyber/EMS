import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Req,
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

  @Roles('admin', 'manager')
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectService.create(dto);
  }

  @Roles('admin', 'manager', 'employee')
  @Get()
  findAll(@Query() pagination: PaginationDto, @Req() req) {
    return this.projectService.findAll(pagination, req.user);
    // return this.projectService.findAll(pagination);
  }

  @Roles('employee', 'admin', 'manager')
  @Get('employee/stats/:id')
  getEmployeeStats(@Param('id') id: string) {
    return this.projectService.getEmployeeProjectStats(id);
  }

  @Roles('employee', 'admin', 'manager')
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.projectService.findOne(id, req.user);
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
