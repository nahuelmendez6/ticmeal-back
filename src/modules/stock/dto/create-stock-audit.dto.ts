import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStockAuditDto {
  @IsNumber()
  @IsNotEmpty()
  ingredientId: number;

  @IsNumber()
  @IsNotEmpty()
  physicalStock: number;

  @IsOptional()
  @IsString()
  observations?: string;
}
