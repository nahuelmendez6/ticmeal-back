import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Raw } from 'typeorm';
import { MealShift } from '../entities/meal-shift.entity';
import { CreateMealShiftDto } from '../dto/create-meal-shift.dto';
import { UpdateMealShiftDto } from '../dto/update-meal-shift.dto';
import { MenuItems } from '../entities/menu-items.entity';
import { MovementType } from '../enums/enums';
import { StockService } from './stock.service';

@Injectable()
export class MealShiftService {
  private readonly logger = new Logger(MealShiftService.name);

  constructor(
    @InjectRepository(MealShift)
    private readonly mealShiftRepository: Repository<MealShift>,
    private readonly stockService: StockService,
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
      const menuItem = await queryRunner.manager.findOne(MenuItems, {
        where: { id: menuItemId, companyId },
        relations: ['recipeIngredients', 'recipeIngredients.ingredient'],
      });

      if (!menuItem) {
        throw new NotFoundException(
          `Menu Item with ID ${menuItemId} not found`,
        );
      }

      const mealShift = queryRunner.manager.create(MealShift, {
        ...createMealShiftDto,
        date: new Date(createMealShiftDto.date).toISOString().split('T')[0],
        companyId,
        quantityAvailable:
          createMealShiftDto.quantityAvailable ?? quantityProduced,
      });
      const savedMealShift = await queryRunner.manager.save(mealShift);

      // Register stock movement for the produced MenuItem (IN)
      await this.stockService.registerMovement(
        {
          menuItemId: menuItem.id,
          quantity: quantityProduced,
          movementType: MovementType.IN,
          reason: 'Producción',
          unitCost: menuItem.price,
        },
        companyId,
        userId,
        queryRunner,
      );

      // Register stock movements for the consumed ingredients (OUT)
      if (menuItem.recipeIngredients && menuItem.recipeIngredients.length > 0) {
        for (const recipeIngredient of menuItem.recipeIngredients) {
          const ingredient = recipeIngredient.ingredient;
          const quantityRequired = recipeIngredient.quantity * quantityProduced;

          await this.stockService.registerMovement(
            {
              ingredientId: ingredient.id,
              quantity: quantityRequired,
              movementType: MovementType.OUT,
              reason: `Producción de ${menuItem.name}`,
            },
            companyId,
            userId,
            queryRunner,
          );
        }
      }

      await queryRunner.commitTransaction();
      return savedMealShift;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
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

