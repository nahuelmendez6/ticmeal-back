import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category, } from './entities/category.entity';
import { MenuItems } from './entities/menu-items.entity';
import { Ingredient } from './entities/ingredient.entity';
import { IngredientCategory } from './entities/ingredient-category.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { StockMovement } from './entities/stock-movement.entity';   

import { CategoryService } from './services/category.service';
import { IngredientCategoryService } from './services/ingredient-category.service';
import { IngredientService } from './services/ingredient.service';

import { CategoryController } from './controllers/category.controller';
import { IngredientCategoryController } from './controllers/ingredient-category.controller';
import { IngredientController } from './controllers/ingredient.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      MenuItems,
      Ingredient,
      IngredientCategory,
      RecipeIngredient,
      StockMovement,
    ]),
  ],
  providers: [CategoryService, IngredientCategoryService, IngredientService],
  controllers: [CategoryController, IngredientCategoryController, IngredientController],
  exports: [CategoryService],
})
export class StockModule {}