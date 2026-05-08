import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Roles('admin', 'manager')
  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @Roles('admin', 'manager', 'employee')
  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 10, @Req() req) {
    return this.taskService.findAll(Number(page), Number(limit), req.user);
  }

  @Roles('admin', 'manager', 'employee')
  @Get('project/:identifier')
  findByProject(@Param('identifier') identifier: string, @Req() req) {
    return this.taskService.findByProject(identifier, req.user);
  }

  @Roles('admin', 'manager', 'employee')
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.taskService.findOne(id, req.user);
  }

  @Roles('admin', 'manager')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.taskService.update(id, dto);
  }

  @Roles('admin', 'manager')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(id);
  }
}
