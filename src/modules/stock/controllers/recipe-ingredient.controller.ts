import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { RecipeIngredientService } from '../services/recipe-ingredient.service';
import { CreateRecipeIngredientDto } from '../dto/create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../dto/update-recipe-ingredient.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { Tenant } from 'src/common/decorators/tenant-decorator';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recipe-ingredients')
export class RecipeIngredientController {
  constructor(
    private readonly recipeIngredientService: RecipeIngredientService,
  ) {}

  /**
   * Añade un nuevo ingrediente a una receta existente.
   * Accesible solo para administradores de la empresa y de cocina.
   */
  @Post()
  @Roles('company_admin', 'kitchen_admin')
  @HttpCode(HttpStatus.CREATED)
  async addIngredient(
    @Body() createDto: CreateRecipeIngredientDto,
    @Tenant() tenantId: number,
  ): Promise<RecipeIngredient> {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.recipeIngredientService.addIngredientToRecipe(
      createDto,
      tenantId,
    );
  }

  /**
   * Obtiene todos los ingredientes de la receta de un MenuItem específico.
   * Accesible para todos los roles autenticados.
   */
  @Get('by-menu-item/:menuItemId')
  @Roles('company_admin', 'kitchen_admin', 'diner')
  async findForRecipe(
    @Param('menuItemId', ParseIntPipe) menuItemId: number,
    @Tenant() tenantId: number,
  ): Promise<RecipeIngredient[]> {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.recipeIngredientService.findIngredientsForRecipe(
      menuItemId,
      tenantId,
    );
  }

  /**
   * Actualiza la cantidad de un ingrediente en una receta.
   * El ID corresponde al de la entidad RecipeIngredient.
   * Accesible solo para administradores de la empresa y de cocina.
   */
  @Patch(':id')
  @Roles('company_admin', 'kitchen_admin')
  async updateQuantity(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateRecipeIngredientDto,
    @Tenant() tenantId: number,
  ): Promise<RecipeIngredient> {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.recipeIngredientService.updateIngredientQuantity(
      id,
      updateDto,
      tenantId,
    );
  }

  /**
   * Elimina un ingrediente de una receta.
   * El ID corresponde al de la entidad RecipeIngredient.
   * Accesible solo para administradores de la empresa y de cocina.
   */
  @Delete(':id')
  @Roles('company_admin', 'kitchen_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeIngredient(
    @Param('id', ParseIntPipe) id: number,
    @Tenant() tenantId: number,
  ): Promise<void> {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    await this.recipeIngredientService.removeIngredientFromRecipe(id, tenantId);
  }
}
