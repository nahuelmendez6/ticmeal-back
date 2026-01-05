import { PartialType } from '@nestjs/mapped-types';
import { CreateMealShiftDto } from './create-meal-shift.dto';

export class UpdateMealShiftDto extends PartialType(CreateMealShiftDto) {}