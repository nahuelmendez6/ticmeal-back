import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, IsInt } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(['super_admin', 'company_admin', 'diner', 'kitchen', 'kitchen_admin'])
  role?: string;

  @IsOptional()
  @Matches(/^\d{4}$/, { message: 'El PIN debe tener exactamente 4 dígitos numéricos' })
  pin?: string;

  @IsOptional()
  @IsInt()
  companyId?: number;
}
