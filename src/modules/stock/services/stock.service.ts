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
import { IngredientLot } from '../entities/ingredient-lot.entity';
import { MenuItemLot } from '../entities/menu-item-lot.entity';

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
      relations: ['performedBy', 'ingredientLot'],
    });
  }

  async findHistoryForMenuItem(
    menuItemId: number,
    companyId: number,
  ): Promise<StockMovement[]> {
    return this.stockMovementRepo.find({
      where: { menuItem: { id: menuItemId }, companyId },
      order: { createdAt: 'DESC' as const },
      relations: ['performedBy', 'menuItemLot'],
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
      const {
        menuItemId,
        ingredientId,
        quantity,
        movementType,
        lotNumber,
        unitCost,
        ingredientLotId,
        menuItemLotId,
      } = createDto;

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

      let savedMovement: StockMovement;

      if (movementType === MovementType.IN) {
        savedMovement = await this.handleInMovement(
          runner,
          createDto,
          companyId,
          userId,
        );
      } else if (movementType === MovementType.OUT) {
        savedMovement = await this.handleOutMovement(
          runner,
          createDto,
          companyId,
          userId,
        );
      } else {
        throw new BadRequestException('Tipo de movimiento no válido.');
      }

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

  private async handleInMovement(
    runner: QueryRunner,
    createDto: CreateStockMovementDto,
    companyId: number,
    userId: number,
  ): Promise<StockMovement> {
    const {
      ingredientId,
      menuItemId,
      quantity,
      lotNumber,
      unitCost,
      expirationDate,
    } = createDto;

    if (!lotNumber || unitCost === undefined) {
      throw new BadRequestException(
        'Para movimientos de ENTRADA, se requiere lotNumber y unitCost.',
      );
    }

    let lot: IngredientLot | MenuItemLot;
    let newStockInLot: number;
    const user = { id: userId } as User;

    if (ingredientId) {
      const ingredientRepo = runner.manager.getRepository(Ingredient);
      const ingredient = await ingredientRepo.findOneBy({
        id: ingredientId,
        companyId,
      });
      if (!ingredient)
        throw new NotFoundException('Ingrediente no encontrado.');

      const lotRepo = runner.manager.getRepository(IngredientLot);
      const existingLot = await lotRepo.findOne({
        where: { lotNumber, ingredient: { id: ingredientId }, companyId },
      });

      if (existingLot) {
        existingLot.quantity += quantity;
        existingLot.unitCost = unitCost; // Opcional: actualizar costo al del último ingreso
        lot = await runner.manager.save(existingLot);
      } else {
        const newLot = lotRepo.create({
          ingredient,
          lotNumber,
          quantity,
          unitCost,
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          companyId,
        });
        lot = await runner.manager.save(newLot);
      }
      newStockInLot = lot.quantity;

      const movement = runner.manager.create(StockMovement, {
        ...createDto,
        companyId,
        performedBy: user,
        ingredient,
        ingredientLot: lot,
        stockAfter: newStockInLot,
        unit: ingredient.unit,
      });
      return runner.manager.save(movement);
    } else {
      // Lógica para menuItemId
      const menuItemRepo = runner.manager.getRepository(MenuItems);
      const menuItem = await menuItemRepo.findOneBy({
        id: menuItemId,
        companyId,
      });
      if (!menuItem) throw new NotFoundException('Ítem de menú no encontrado.');

      const lotRepo = runner.manager.getRepository(MenuItemLot);
      const existingLot = await lotRepo.findOne({
        where: { lotNumber, menuItem: { id: menuItemId }, companyId },
      });

      if (existingLot) {
        existingLot.quantity += quantity;
        existingLot.unitCost = unitCost;
        lot = await runner.manager.save(existingLot);
      } else {
        const newLot = lotRepo.create({
          menuItem,
          lotNumber,
          quantity,
          unitCost,
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          companyId,
        });
        lot = await runner.manager.save(newLot);
      }
      newStockInLot = lot.quantity;

      const movement = runner.manager.create(StockMovement, {
        ...createDto,
        companyId,
        performedBy: user,
        menuItem,
        menuItemLot: lot,
        stockAfter: newStockInLot,
        unit: 'unit' as any, // MenuItem no tiene unidad, se usa 'unit' por defecto
      });
      return runner.manager.save(movement);
    }
  }

  private async handleOutMovement(
    runner: QueryRunner,
    createDto: CreateStockMovementDto,
    companyId: number,
    userId: number,
  ): Promise<StockMovement> {
    const {
      quantity,
      ingredientId,
      menuItemId,
      ingredientLotId,
      menuItemLotId,
    } = createDto;

    if (!ingredientLotId && !menuItemLotId) {
      throw new BadRequestException(
        'Para movimientos de SALIDA, se requiere ingredientLotId o menuItemLotId.',
      );
    }

    let lot: IngredientLot | MenuItemLot;
    let newStockInLot: number;
    const user = { id: userId } as User;

    if (ingredientLotId) {
      if (!ingredientId)
        throw new BadRequestException(
          'Se proporcionó ingredientLotId pero no ingredientId.',
        );
      const lotRepo = runner.manager.getRepository(IngredientLot);
      lot = await lotRepo.findOne({
        where: { id: ingredientLotId, companyId },
        relations: ['ingredient'],
      });
      if (!lot)
        throw new NotFoundException('Lote de ingrediente no encontrado.');
      if (lot.ingredient.id !== ingredientId)
        throw new BadRequestException(
          'El lote no corresponde al ingrediente especificado.',
        );
    } else {
      // Lógica para menuItemLotId
      if (!menuItemId)
        throw new BadRequestException(
          'Se proporcionó menuItemLotId pero no menuItemId.',
        );
      const lotRepo = runner.manager.getRepository(MenuItemLot);
      lot = await lotRepo.findOne({
        where: { id: menuItemLotId, companyId },
        relations: ['menuItem'],
      });
      if (!lot)
        throw new NotFoundException('Lote de ítem de menú no encontrado.');
      if (lot.menuItem.id !== menuItemId)
        throw new BadRequestException(
          'El lote no corresponde al ítem de menú especificado.',
        );
    }

    if (lot.quantity < quantity) {
      throw new BadRequestException(
        `Stock insuficiente en el lote. Disponible: ${lot.quantity}, Requerido: ${quantity}`,
      );
    }

    lot.quantity -= quantity;
    await runner.manager.save(lot);
    newStockInLot = lot.quantity;

    const movement = runner.manager.create(StockMovement, {
      ...createDto,
      companyId,
      performedBy: user,
      ingredient: ingredientId ? ({ id: ingredientId } as Ingredient) : null,
      menuItem: menuItemId ? ({ id: menuItemId } as MenuItems) : null,
      ingredientLot: ingredientLotId ? (lot as IngredientLot) : null,
      menuItemLot: menuItemLotId ? (lot as MenuItemLot) : null,
      stockAfter: newStockInLot,
      unit:
        'ingredient' in lot ? (lot as any).ingredient.unit : ('unit' as any),
    });

    return runner.manager.save(movement);
  }
}
