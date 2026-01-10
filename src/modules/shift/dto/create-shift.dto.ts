import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsArray,
  IsInt,
  Matches,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShiftDto {
  @ApiProperty({
    description: 'Nombre del turno',
    example: 'Turno Mañana',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Hora de inicio del turno en formato HH:MM',
    example: '08:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime debe tener el formato HH:MM',
  })
  startTime: string;

  @ApiProperty({
    description: 'Hora de fin del turno en formato HH:MM',
    example: '16:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime debe tener el formato HH:MM',
  })
  endTime: string;

  @ApiProperty({
    description: 'Indica si el menú está activo para este turno',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  menuActive?: boolean;

  @ApiProperty({
    description: 'Array de IDs de los ítems de menú asociados al turno',
    example: [1, 2, 5],
    required: false,
  })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  menuItemIds?: number[];

  @ApiProperty({
    description: 'Fecha para la cual se aplica la actualización del turno (YYYY-MM-DD)',
    example: '2026-01-09',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  date?: string;
}
