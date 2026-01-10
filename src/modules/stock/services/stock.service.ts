import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { StockMovement } from '../entities/stock-movement.entity';
import { Ingredient } from '../entities/ingredient.entity';
import { MenuItems } from '../entities/menu-items.entity';
import { MovementType } from '../enums/enums';
import { CreateStockMovementDto } from '../dto/create-stock-movement.dto';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepo: Repository<StockMovement>,
    private readonly dataSource: DataSource,
  ) {}

  async findHistoryForIngredient(
    ingredientId: number,
    companyId: number,
  ): Promise<StockMovement[]> {
    return this.stockMovementRepo.find({
      where: { ingredient: { id: ingredientId }, companyId },
      order: { createdAt: 'DESC' as const },
      relations: ['performedBy'],
    });
  }

  async findHistoryForMenuItem(
    menuItemId: number,
    companyId: number,
  ): Promise<StockMovement[]> {
    return this.stockMovementRepo.find({
      where: { menuItem: { id: menuItemId }, companyId },
      order: { createdAt: 'DESC' as const },
      relations: ['performedBy'],
    });
  }

  async registerMovement(
    createDto: CreateStockMovementDto,
    companyId: number,
    userId: number,
    queryRunner?: QueryRunner,
  ): Promise<StockMovement> {
    const runner = queryRunner || this.dataSource.createQueryRunner();

    if (!queryRunner) {
      await runner.connect();
      await runner.startTransaction();
    }

    try {
      const { menuItemId, ingredientId, quantity, movementType } = createDto;

      if (!menuItemId && !ingredientId) {
        throw new BadRequestException(
          'Debe proporcionar un menuItemId o un ingredientId.',
        );
      }
      if (menuItemId && ingredientId) {
        throw new BadRequestException(
          'No puede proporcionar menuItemId e ingredientId simultáneamente.',
        );
      }

      let currentStock = 0;
      let item: Ingredient | MenuItems;
      const itemRepo = menuItemId
        ? runner.manager.getRepository(MenuItems)
        : runner.manager.getRepository(Ingredient);
      const itemId = menuItemId || ingredientId;

      item = await itemRepo.findOneBy({ id: itemId, companyId });

      if (!item) {
        throw new NotFoundException(
          `El producto con ID ${itemId} no fue encontrado.`,
        );
      }

      currentStock = 'stock' in item ? item.stock : item.quantityInStock;

      const quantityChange =
        movementType === MovementType.IN ? quantity : -quantity;
      const newStock = currentStock + quantityChange;

      if (newStock < 0) {
        throw new BadRequestException(
          `El stock no puede ser negativo. Stock actual: ${currentStock}, Intento de reducir: ${quantity}`,
        );
      }

      // Update item stock
      if ('stock' in item) {
        item.stock = newStock;
      } else {
        item.quantityInStock = newStock;
      }
      await runner.manager.save(item);

      const newMovement = runner.manager.create(StockMovement, {
        ...createDto,
        companyId,
        performedBy: { id: userId } as User,
        stockAfter: newStock,
        unit: 'stock' in item ? ('unit' as any) : item.unit,
        menuItem: menuItemId ? ({ id: menuItemId } as MenuItems) : null,
        ingredient: ingredientId ? ({ id: ingredientId } as Ingredient) : null,
      });

      const savedMovement = await runner.manager.save(newMovement);

      if (!queryRunner) {
        await runner.commitTransaction();
      }

      return savedMovement;
    } catch (err) {
      if (!queryRunner) {
        await runner.rollbackTransaction();
      }
      throw err;
    } finally {
      if (!queryRunner) {
        await runner.release();
      }
    }
  }
}
