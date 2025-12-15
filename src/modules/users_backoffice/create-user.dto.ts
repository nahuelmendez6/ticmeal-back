import { IsEmail, IsString, IsOptional, IsEnum, IsNumber, IsArray, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(['super_admin', 'company_admin', 'diner', 'kitchen', 'kitchen_admin'])
  role: string;

  @IsNumber()
  @IsOptional()
  companyId?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  observationIds?: number[];
}