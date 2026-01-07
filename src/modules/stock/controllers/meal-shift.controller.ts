import { Controller, Get, Post, Body, Patch, Param, Delete, Request, ParseIntPipe, UseGuards } from '@nestjs/common';
import { MealShiftService } from '../services/meal-shift.service';
import { CreateMealShiftDto } from '../dto/create-meal-shift.dto';
import { UpdateMealShiftDto } from '../dto/update-meal-shift.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('meal-shifts')
export class MealShiftController {
  constructor(private readonly mealShiftService: MealShiftService) {}

  @Post()
  @Roles('company_admin', 'kitchen_admin')
  create(@Body() createMealShiftDto: CreateMealShiftDto, @Request() req) {
    // Asumimos que el guard de autenticación popula req.user con companyId
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    return this.mealShiftService.create(createMealShiftDto, companyId, userId);
  }

  @Get()
  @Roles('company_admin', 'kitchen_admin')
  findAll(@Request() req) {
    const companyId = req.user?.companyId;
    return this.mealShiftService.findAll(companyId);
  }

  @Get(':id')
  @Roles('company_admin', 'kitchen_admin')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const companyId = req.user?.companyId;
    return this.mealShiftService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles('company_admin', 'kitchen_admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMealShiftDto: UpdateMealShiftDto,
    @Request() req,
  ) {
    const companyId = req.user?.companyId;
    return this.mealShiftService.update(id, updateMealShiftDto, companyId);
  }

  @Delete(':id')
  @Roles('company_admin', 'kitchen_admin')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const companyId = req.user?.companyId;
    return this.mealShiftService.remove(id, companyId);
  }
}