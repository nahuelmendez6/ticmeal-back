import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { IngredientCategory } from './entities/ingredient-category.entity';
import { Ingredient } from './entities/ingredient.entity';
import { MenuItems } from './entities/menu-items.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { CategoryService } from './services/category.service';
import { IngredientCategoryService } from './services/ingredient-category.service';
import { IngredientService } from './services/ingredient.service';
import { MenuItemService } from './services/menu-item.service';
import { RecipeIngredientService } from './services/recipe-ingredient.service';
import { CategoryController } from './controllers/category.controller';
import { IngredientCategoryController } from './controllers/ingredient-category.controller';
import { IngredientController } from './controllers/ingredient.controller';
import { MenuItemController } from './controllers/menu-item.controller';
import { RecipeIngredientController } from './controllers/recipe-ingredient.controller';
import { MealShift } from './entities/meal-shift.entity';
import { MealShiftController } from './controllers/meal-shift.controller';
import { MealShiftService } from './services/meal-shift.service';
import { ShiftModule } from '../shift/shift.module';
import { StockController } from './controllers/stock.controller';
import { StockService } from './services/stock.service';
import { IngredientLot } from './entities/ingredient-lot.entity';
import { MenuItemLot } from './entities/menu-item-lot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      IngredientCategory,
      Ingredient,
      MenuItems,
      RecipeIngredient,
      StockMovement,
      MealShift,
      IngredientLot,
      MenuItemLot,
    ]),
    ShiftModule,
  ],
  controllers: [
    CategoryController,
    IngredientCategoryController,
    IngredientController,
    MenuItemController,
    RecipeIngredientController,
    MealShiftController,
    StockController,
  ],
  providers: [
    CategoryService,
    IngredientCategoryService,
    IngredientService,
    MenuItemService,
    RecipeIngredientService,
    MealShiftService,
    StockService,
  ],
  exports: [
    CategoryService,
    IngredientService,
    MenuItemService,
    MealShiftService,
    StockService,
  ],
})
export class StockModule {}

