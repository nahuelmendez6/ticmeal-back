// src/modules/stock/controllers/ingredient-category.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { IngredientCategoryService } from '../services/ingredient-category.service';
import { CreateIngredientCategoryDto } from '../dto/create-ingredient-category.dto';
import { UpdateIngredientCategoryDto } from '../dto/update-ingredient-category.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { Tenant } from 'src/common/decorators/tenant-decorator';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ingredient-categories')
export class IngredientCategoryController {
  constructor(
    private readonly ingredientCategoryService: IngredientCategoryService,
  ) {}

  @Post()
  @Roles('super_admin', 'company_admin')
  async create(
    @Body() createDto: CreateIngredientCategoryDto,
    @Tenant() tenantId: number | undefined,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant');
    }
    return this.ingredientCategoryService.create(createDto, tenantId);
  }

  @Get()
  async findAll(@Tenant() tenantId: number | undefined) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant');
    }
    return this.ingredientCategoryService.findAllForTenant(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Tenant() tenantId: number | undefined,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant');
    }
    return this.ingredientCategoryService.findOneForTenant(id, tenantId);
  }

  @Put(':id')
  @Roles('super_admin', 'company_admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateIngredientCategoryDto,
    @Tenant() tenantId: number | undefined,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant');
    }
    return this.ingredientCategoryService.update(id, updateDto, tenantId);
  }

  @Delete(':id')
  @Roles('super_admin', 'company_admin')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Tenant() tenantId: number | undefined,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant');
    }
    await this.ingredientCategoryService.remove(id, tenantId);
    return {
      message: 'Categoría de ingrediente eliminada correctamente.',
      success: true,
    };
  }
}
