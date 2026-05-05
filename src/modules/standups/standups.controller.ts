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

@Controller('standups')
export class StandupsController {
  constructor(private readonly standupsService: StandupsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateStandupDto, @Req() req) {
    return this.standupsService.create({
      ...dto,
      userId: req.user.id, // ✅ always valid UUID
    });
  }

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('date') date?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.standupsService.findAll({
      userId,
      date,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.standupsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStandupDto,
  ) {
    return this.standupsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.standupsService.remove(id);
  }
}
