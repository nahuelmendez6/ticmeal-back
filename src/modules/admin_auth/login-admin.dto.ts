import { IsEmail, IsString } from 'class-validator';

export class LoginAdminDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
