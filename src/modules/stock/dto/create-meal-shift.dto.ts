import { IsDateString, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateMealShiftDto {
  @IsDateString()
  date: string;

  @IsInt()
  shiftId: number;

  @IsInt()
  menuItemId: number;

  @IsNumber()
  @Min(0)
  quantityProduced: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantityAvailable?: number;
}