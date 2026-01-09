import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { MenuItems } from './entities/menu-items.entity';
import { Ingredient } from './entities/ingredient.entity';
import { IngredientCategory } from './entities/ingredient-category.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { StockMovement } from './entities/stock-movement.entity';

import { CategoryService } from './services/category.service';
import { IngredientCategoryService } from './services/ingredient-category.service';
import { IngredientService } from './services/ingredient.service';
import { MenuItemService } from './services/menu-item.service';
import { RecipeIngredientService } from './services/recipe-ingredient.service';
import { MealShift } from '../stock/entities/meal-shift.entity';
import { MealShiftService } from './services/meal-shift.service';
import { CategoryController } from './controllers/category.controller';
import { IngredientCategoryController } from './controllers/ingredient-category.controller';
import { IngredientController } from './controllers/ingredient.controller';
import { MenuItemController } from './controllers/menu-item.controller';
import { RecipeIngredientController } from './controllers/recipe-ingredient.controller';
import { MealShiftController } from './controllers/meal-shift.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      MenuItems,
      Ingredient,
      IngredientCategory,
      RecipeIngredient,
      StockMovement,
      MealShift,
    ]),
  ],
  providers: [
    CategoryService,
    IngredientCategoryService,
    IngredientService,
    MenuItemService,
    RecipeIngredientService,
    MealShiftService,
  ],
  controllers: [
    CategoryController,
    IngredientCategoryController,
    IngredientController,
    MenuItemController,
    RecipeIngredientController,
    MealShiftController,
  ],
  exports: [
    TypeOrmModule,
    CategoryService,
    IngredientCategoryService,
    IngredientService,
    MenuItemService,
    RecipeIngredientService,
    MealShiftService,
  ],
})
export class StockModule {}
