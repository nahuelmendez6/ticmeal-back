import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { MovementType } from '../../stock/enums/enums';

export class GetStockMovementsReportDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(MovementType)
  movementType?: MovementType;
}