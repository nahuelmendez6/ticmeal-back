import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Ingredient } from '../entities/ingredient.entity';
import { CreateIngredientDto } from '../dto/create-ingredient.dto';
import { IngredientCategory } from '../entities/ingredient-category.entity';
import { UpdateIngredientDto } from '../dto/update-ingredient.dto';
import { IngredientCategoryService } from './ingredient-category.service';
import { StockService } from './stock.service'; // Import StockService
import { MovementType } from '../enums/enums';

@Injectable()
export class IngredientService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,
    private readonly ingredientCategoryService: IngredientCategoryService,
    private readonly stockService: StockService, // Inject StockService
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createDto: CreateIngredientDto,
    companyId: number,
    userId: number,
  ): Promise<Ingredient> {
    const {
      categoryId,
      quantityInStock: initialStock,
      ...ingredientData
    } = createDto;

    if (categoryId) {
      await this.ingredientCategoryService.validateCategoryAvailability(
        categoryId,
        companyId,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create ingredient with 0 stock initially
      const newIngredient = queryRunner.manager.create(Ingredient, {
        ...ingredientData,
        quantityInStock: 0, // Stock starts at 0
        companyId: companyId,
        category: categoryId ? { id: categoryId } : null,
      });
      const savedIngredient = await queryRunner.manager.save(newIngredient);

      // If there's an initial stock, register it as a movement
      if (initialStock && initialStock > 0) {
        await this.stockService.registerMovement(
          {
            ingredientId: savedIngredient.id,
            quantity: initialStock,
            movementType: MovementType.IN,
            reason: 'Carga inicial',
            unitCost: createDto.cost,
          },
          companyId,
          userId,
          queryRunner, // Pass the runner to stay in the same transaction
        );
      }

      await queryRunner.commitTransaction();
      // Refetch to get the updated stock value
      return this.findOneForTenant(savedIngredient.id, companyId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllForTenant(companyId: number): Promise<Ingredient[]> {
    return this.ingredientRepo.find({
      where: { companyId },
      order: { name: 'ASC' },
    });
  }

  async findOneForTenant(id: number, companyId: number): Promise<Ingredient> {
    const ingredient = await this.ingredientRepo.findOne({
      where: { id, companyId },
      relations: ['category'], // Eager load category
    });

    if (!ingredient) {
      throw new NotFoundException(
        `Ingrediente con ID ${id} no encontrado o sin permisos.`,
      );
    }
    return ingredient;
  }

  async update(
    id: number,
    updateDto: UpdateIngredientDto,
    companyId: number,
    userId: number,
  ): Promise<Ingredient> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ingredientToUpdate = await queryRunner.manager.findOne(Ingredient, {
        where: { id, companyId },
      });

      if (!ingredientToUpdate) {
        throw new NotFoundException(`Ingrediente con ID ${id} no encontrado.`);
      }

      const originalStock = ingredientToUpdate.quantityInStock;
      const {
        quantityInStock: newStock,
        categoryId,
        ...updateData
      } = updateDto;

      // Update non-stock fields first
      queryRunner.manager.merge(Ingredient, ingredientToUpdate, updateData);
      if (updateDto.hasOwnProperty('categoryId')) {
        if (categoryId) {
          await this.ingredientCategoryService.validateCategoryAvailability(
            categoryId,
            companyId,
          );
          ingredientToUpdate.category =
            { id: categoryId } as IngredientCategory;
        } else {
          ingredientToUpdate.category = null;
        }
      }
      await queryRunner.manager.save(ingredientToUpdate);

      // If stock has changed, register a movement
      if (newStock !== undefined && newStock !== originalStock) {
        const quantityDiff = newStock - originalStock;
        if (quantityDiff !== 0) {
          await this.stockService.registerMovement(
            {
              ingredientId: id,
              quantity: Math.abs(quantityDiff),
              movementType:
                quantityDiff > 0 ? MovementType.IN : MovementType.OUT,
              reason: 'Ajuste de stock',
              unitCost: updateDto.cost,
            },
            companyId,
            userId,
            queryRunner,
          );
        }
      }

      await queryRunner.commitTransaction();
      return this.findOneForTenant(id, companyId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number, companyId: number): Promise<boolean> {
    const result = await this.ingredientRepo.delete({ id, companyId });
    if (result.affected === 0) {
      throw new NotFoundException(
        `Ingrediente con ID ${id} no encontrado en su alcance.`,
      );
    }
    return true;
  }
}

