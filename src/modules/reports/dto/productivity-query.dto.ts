import { PartialType } from '@nestjs/mapped-types';
import { CreateReportDto } from './dashboard-query.dto';

export class UpdateReportDto extends PartialType(CreateReportDto) {}
