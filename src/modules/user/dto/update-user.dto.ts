import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  first_name?: string;
  
  @IsString()
  @IsOptional()
  last_name?: string;
  
  @IsOptional()
  mobile?: string;
  
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;
  
  
  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  @IsIn(['admin', 'manager', 'employee'])
  role?: string;

  @IsOptional()
  lastLoginAt?: Date;
}
