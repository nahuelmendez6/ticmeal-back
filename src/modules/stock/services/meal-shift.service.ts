import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, Raw } from 'typeorm';
import { MealShift } from '../entities/meal-shift.entity';
import { CreateMealShiftDto } from '../dto/create-meal-shift.dto';
import { UpdateMealShiftDto } from '../dto/update-meal-shift.dto';
import { MenuItems } from '../entities/menu-items.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { MovementType } from '../enums/enums';
import { Ingredient } from '../entities/ingredient.entity';

@Injectable()
export class MealShiftService {
  private readonly logger = new Logger(MealShiftService.name);

  constructor(
    @InjectRepository(MealShift)
    private readonly mealShiftRepository: Repository<MealShift>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createMealShiftDto: CreateMealShiftDto,
    companyId: number,
    userId?: number,
  ): Promise<MealShift> {
    const { menuItemId, quantityProduced } = createMealShiftDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener el MenuItem y sus ingredientes de receta
      const menuItem = await queryRunner.manager.findOne(MenuItems, {
        where: { id: menuItemId, companyId },
        relations: ['recipeIngredients', 'recipeIngredients.ingredient'],
      });

      if (!menuItem) {
        throw new NotFoundException(
          `Menu Item with ID ${menuItemId} not found`,
        );
      }

      // 2. Crear el MealShift
      const mealShift = queryRunner.manager.create(MealShift, {
        ...createMealShiftDto,
        date: new Date(createMealShiftDto.date).toISOString().split('T')[0], // Ensure date is stored as YYYY-MM-DD
        companyId,
        quantityAvailable:
          createMealShiftDto.quantityAvailable ?? quantityProduced,
      });
      const savedMealShift = await queryRunner.manager.save(mealShift);

      // 3. Registrar movimiento de stock para el MenuItem (PRODUCCION -> IN)
      const menuItemMovement = this.stockMovementRepository.create({
        menuItem,
        quantity: quantityProduced,
        movementType: MovementType.IN,
        reason: 'PRODUCCION',
        unit: 'unit' as any,
        company: { id: companyId },
        performedBy: userId ? { id: userId } : null,
      });
      await queryRunner.manager.save(menuItemMovement);

      // Actualizar stock del MenuItem
      menuItem.stock = (menuItem.stock || 0) + quantityProduced;
      await queryRunner.manager.save(menuItem);

      // 4. Registrar movimientos de stock para los ingredientes (PRODUCCION -> OUT)
      await this.deductIngredientsStock(
        queryRunner,
        menuItem,
        quantityProduced,
        companyId,
        userId,
      );

      await queryRunner.commitTransaction();
      return savedMealShift;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async deductIngredientsStock(
    queryRunner: QueryRunner,
    menuItem: MenuItems,
    quantityProduced: number,
    companyId: number,
    userId?: number,
  ) {
    if (menuItem.recipeIngredients && menuItem.recipeIngredients.length > 0) {
      for (const recipeIngredient of menuItem.recipeIngredients) {
        const ingredient = recipeIngredient.ingredient;
        const quantityRequired = recipeIngredient.quantity * quantityProduced;

        // Actualizar stock del ingrediente
        await queryRunner.manager.decrement(
          Ingredient,
          { id: ingredient.id },
          'quantityInStock',
          quantityRequired,
        );

        const ingredientMovement = this.stockMovementRepository.create({
          ingredient,
          quantity: quantityRequired,
          movementType: MovementType.OUT,
          reason: 'meal',
          unit: ingredient.unit,
          company: { id: companyId },
          performedBy: userId ? { id: userId } : null,
        });
        await queryRunner.manager.save(ingredientMovement);
      }
    }
  }

  async findAll(companyId: number): Promise<MealShift[]> {
    return await this.mealShiftRepository.find({
      where: { companyId },
      relations: ['shift', 'menuItem'],
      order: { date: 'DESC' },
    });
  }

  async findOne(id: number, companyId: number): Promise<MealShift> {
    const mealShift = await this.mealShiftRepository.findOne({
      where: { id, companyId },
      relations: ['shift', 'menuItem'],
    });

    if (!mealShift) {
      throw new NotFoundException(`MealShift with ID ${id} not found`);
    }

    return mealShift;
  }

  async update(
    id: number,
    updateMealShiftDto: UpdateMealShiftDto,
    companyId: number,
  ): Promise<MealShift> {
    const mealShift = await this.findOne(id, companyId);
    const updated = this.mealShiftRepository.merge(
      mealShift,
      updateMealShiftDto,
    );
    return await this.mealShiftRepository.save(updated);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const mealShift = await this.findOne(id, companyId);
    await this.mealShiftRepository.remove(mealShift);
  }

  async isMenuItemProducedForShift(
    menuItemId: number,
    shiftId: number,
    date: Date,
    companyId: number,
  ): Promise<boolean> {
    this.logger.log(
      `Checking production for menuItemId: ${menuItemId}, shiftId: ${shiftId}, date: ${date.toISOString()}, companyId: ${companyId}`,
    );

    // Convert date to YYYY-MM-DD string to avoid timezone issues with the DB query
    const dateString = date.toISOString().split('T')[0];

    const mealShift = await this.mealShiftRepository.findOne({
      where: {
        menuItemId,
        shiftId,
        companyId,
        date: Raw((alias) => `${alias} = :date`, { date: dateString }),
      },
    });

    const result = mealShift && mealShift.quantityProduced > 0;
    this.logger.log(`Production check result: ${result}`);

    return result;
  }
}
