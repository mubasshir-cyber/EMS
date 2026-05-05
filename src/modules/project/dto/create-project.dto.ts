import { IsString, IsOptional, IsArray, IsNotEmpty, IsDate, IsDateString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  project_name!: string;

  @IsOptional()
  @IsString()
  project_description?: string;

  @IsOptional()
  @IsDateString()
  projectStartDate?: string;

  @IsNotEmpty()
  @IsDateString()
  deadline?: string;

  @IsArray()
  @IsString({ each: true })
  team!: string[]; // array of user IDs
}