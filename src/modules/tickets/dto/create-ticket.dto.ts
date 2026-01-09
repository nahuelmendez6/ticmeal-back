import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  ValidateIf,
  IsOptional,
} from 'class-validator';

export class CreateTicketDto {
  // @ValidateIf((o) => !o.userId)
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, { message: 'El PIN debe tener exactamente 4 dígitos' })
  pin: string;

  @IsOptional()
  @IsInt()
  userId?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  menuItemIds: number[];
}
