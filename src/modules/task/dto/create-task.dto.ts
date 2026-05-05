import {
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
  IsDateString,
} from 'class-validator';
import { TaskStatus } from '../../../common/enums/task-status.enum';

export class CreateTaskDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  assignees!: string[];

  @IsOptional()
  @IsDateString()
  startTaskDate?: string;

  @IsOptional()
  @IsDateString()
  endTaskDate?: string;
}