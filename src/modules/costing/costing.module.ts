import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostingService } from './services/costing.service';
import { StockModule } from '../stock/stock.module';
import { MenuItems } from '../stock/entities/menu-items.entity';
import { RecipeIngredient } from '../stock/entities/recipe-ingredient.entity';
import { IngredientLot } from '../stock/entities/ingredient-lot.entity';
import { Ingredient } from '../stock/entities/ingredient.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MenuItems,
      RecipeIngredient,
      IngredientLot,
      Ingredient,
    ]),
    forwardRef(() => StockModule),
  ],
  providers: [CostingService],
  exports: [CostingService],
})
export class CostingModule {}
