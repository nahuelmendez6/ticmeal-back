import { IsArray, IsInt, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, { message: 'El PIN debe tener exactamente 4 dígitos' })
  pin: string;
  
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  menuItemIds: number[];
}