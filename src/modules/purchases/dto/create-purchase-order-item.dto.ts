import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';

export class CreatePurchaseOrderItemDto {
  @IsOptional()
  @IsNumber()
  ingredientId?: number;

  @IsOptional()
  @IsNumber()
  menuItemId?: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitCost: number;

  @IsOptional()
  @IsString()
  lot?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;
}
