import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { MenuItems } from '../../stock/entities/menu-items.entity';
import { IngredientLot } from '../../stock/entities/ingredient-lot.entity';

@Injectable()
export class CostingService {
  constructor(
    @InjectRepository(MenuItems)
    private readonly menuItemsRepo: Repository<MenuItems>,
    @InjectRepository(IngredientLot)
    private readonly ingredientLotRepo: Repository<IngredientLot>,
  ) {}

  async calculateMenuItemCost(
    menuItemId: number,
    companyId: number,
  ): Promise<number> {
    const menuItem = await this.menuItemsRepo.findOne({
      where: { id: menuItemId, companyId },
      relations: ['recipeIngredients', 'recipeIngredients.ingredient'],
    });

    if (!menuItem) {
      throw new NotFoundException('Ítem de menú no encontrado.');
    }

    if (
      !menuItem.recipeIngredients ||
      menuItem.recipeIngredients.length === 0
    ) {
      return 0; // O el costo base del producto si no es elaborado
    }

    let totalCost = 0;

    for (const recipeIngredient of menuItem.recipeIngredients) {
      const { ingredient, quantity } = recipeIngredient;
      const realQuantity =
        quantity / (1 - ingredient.shrinkagePercentage / 100);

      const costForIngredient = await this.getFifoCostForIngredient(
        ingredient.id,
        realQuantity,
        companyId,
      );
      totalCost += costForIngredient;
    }

    return totalCost;
  }

  private async getFifoCostForIngredient(
    ingredientId: number,
    quantityNeeded: number,
    companyId: number,
  ): Promise<number> {
    const lots = await this.ingredientLotRepo.find({
      where: {
        ingredient: { id: ingredientId },
        companyId,
        quantity: MoreThan(0),
      },
      order: {
        expirationDate: 'ASC', // O createdAt si se prefiere FIFO estricto
      },
    });

    let cost = 0;
    let quantityToCover = quantityNeeded;

    for (const lot of lots) {
      if (quantityToCover <= 0) break;

      const quantityToTake = Math.min(lot.quantity, quantityToCover);
      cost += quantityToTake * lot.unitCost;
      quantityToCover -= quantityToTake;
    }

    if (quantityToCover > 0) {
      throw new BadRequestException(
        `Stock insuficiente para el ingrediente ${ingredientId}. Faltan ${quantityToCover} unidades.`,
      );
    }

    return cost;
  }
}
