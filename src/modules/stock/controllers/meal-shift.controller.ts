import { Controller, Get, Post, Body, Patch, Param, Delete, Request, ParseIntPipe } from '@nestjs/common';
import { MealShiftService } from '../services/meal-shift.service';
import { CreateMealShiftDto } from '../dto/create-meal-shift.dto';
import { UpdateMealShiftDto } from '../dto/update-meal-shift.dto';

@Controller('meal-shifts')
export class MealShiftController {
  constructor(private readonly mealShiftService: MealShiftService) {}

  @Post()
  create(@Body() createMealShiftDto: CreateMealShiftDto, @Request() req) {
    // Asumimos que el guard de autenticación popula req.user con companyId
    const companyId = req.user?.companyId;
    return this.mealShiftService.create(createMealShiftDto, companyId);
  }

  @Get()
  findAll(@Request() req) {
    const companyId = req.user?.companyId;
    return this.mealShiftService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const companyId = req.user?.companyId;
    return this.mealShiftService.findOne(id, companyId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMealShiftDto: UpdateMealShiftDto,
    @Request() req,
  ) {
    const companyId = req.user?.companyId;
    return this.mealShiftService.update(id, updateMealShiftDto, companyId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const companyId = req.user?.companyId;
    return this.mealShiftService.remove(id, companyId);
  }
}