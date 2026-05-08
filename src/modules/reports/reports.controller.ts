import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';

import { ReportsService } from './reports.service';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

import { RolesGuard } from 'src/common/guards/roles/roles.guard';

import { Roles } from 'src/common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Dashboard Report
  @Roles('admin', 'manager')
  @Get('dashboard')
  getDashboard(@Req() req) {
    return this.reportsService.getDashboard(req.user);
  }

  // Productivity Report
  @Roles('admin', 'manager', 'employee')
  @Get('productivity')
  getProductivity(
    @Query('employeeId')
    employeeId: string,

    @Req() req,
  ) {
    const targetEmployeeId = employeeId || req.user.id;

    return this.reportsService.getProductivity(targetEmployeeId, req.user);
  }
}
