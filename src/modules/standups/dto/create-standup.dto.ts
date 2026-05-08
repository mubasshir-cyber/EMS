import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateStandupDto {
  
  @IsDateString()
  date!: string;

  @IsString()
  @IsOptional()
  yesterdayWork?: string;

  @IsString()
  todayWork!: string;

  @IsString()
  @IsOptional()
  blockers?: string;
}
