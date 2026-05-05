import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateStandupDto {
    @IsString()
    @IsOptional()
    userId?: string;

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
