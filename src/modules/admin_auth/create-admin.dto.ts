import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { AdminRole } from './admin-role.enum';

export class CreateAdminDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsArray()
  @IsEnum(AdminRole, { each: true })
  @IsOptional()
  role?: AdminRole;
}
