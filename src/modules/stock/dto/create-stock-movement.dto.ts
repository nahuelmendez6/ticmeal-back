import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { MovementType } from '../enums/enums';

export class CreateStockMovementDto {
  @IsOptional()
  @IsNumber()
  menuItemId?: number;

  @IsOptional()
  @IsNumber()
  ingredientId?: number;

  @IsNotEmpty()
  @IsEnum(MovementType)
  movementType: MovementType;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @IsString()
  lot?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  relatedTicketId?: string;
}
