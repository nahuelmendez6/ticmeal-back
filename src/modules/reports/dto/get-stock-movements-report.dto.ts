import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { MovementType } from '../../stock/enums/enums';

export class GetStockMovementsReportDto {
  @ApiPropertyOptional({ description: 'Fecha de inicio para el reporte (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Fecha de fin para el reporte (YYYY-MM-DD)' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ enum: MovementType, description: 'Filtrar por tipo de movimiento' })
  @IsEnum(MovementType)
  @IsOptional()
  movementType?: MovementType;

  @ApiPropertyOptional({ description: 'Limitar el número de resultados para reportes como "más consumidos"', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}