import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Ingredient } from '../entities/ingredient.entity';
import { CreateIngredientDto } from '../dto/create-ingredient.dto';
import { IngredientCategory } from '../entities/ingredient-category.entity';
import { UpdateIngredientDto } from '../dto/update-ingredient.dto';
import { IngredientCategoryService } from './ingredient-category.service';
import { StockMovement } from '../entities/stock-movement.entity';
import { MovementType } from '../enums/enums';

@Injectable()
export class IngredientService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,
    private readonly ingredientCategoryService: IngredientCategoryService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crea un nuevo ingrediente para la empresa.
   * Valida que la categoría del ingrediente (si se proporciona) esté disponible para el tenant.
   */
  async create(
    createDto: CreateIngredientDto,
    companyId: number,
    userId: number,
  ): Promise<Ingredient> {
    const { categoryId, category, ...ingredientData } = createDto;

    // Si se incluye una categoría, validar su disponibilidad para el tenant.
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
      const newIngredient = queryRunner.manager.create(Ingredient, {
        ...ingredientData,
        companyId: companyId,
        category: categoryId ? { id: categoryId } : null,
      });
      const savedIngredient = await queryRunner.manager.save(newIngredient);

      if (savedIngredient.quantityInStock > 0) {
        const stockMovement = queryRunner.manager.create(StockMovement, {
          ingredient: savedIngredient,
          quantity: savedIngredient.quantityInStock,
          movementType: MovementType.IN,
          reason: 'Carga inicial',
          unit: savedIngredient.unit,
          companyId,
          performedBy: { id: userId },
        });
        await queryRunner.manager.save(stockMovement);
      }

      await queryRunner.commitTransaction();
      return this.findOneForTenant(savedIngredient.id, companyId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtiene todos los ingredientes disponibles para una empresa.
   */
  async findAllForTenant(companyId: number): Promise<Ingredient[]> {
    return this.ingredientRepo.find({
      where: { companyId },
      order: { name: 'ASC' },
    });
  }

  /**
   * Busca un ingrediente por ID, verificando que pertenezca al tenant.
   */
  async findOneForTenant(id: number, companyId: number): Promise<Ingredient> {
    const ingredient = await this.ingredientRepo.findOne({
      where: { id, companyId },
    });

    if (!ingredient) {
      throw new NotFoundException(
        `Ingrediente con ID ${id} no encontrado o sin permisos.`,
      );
    }
    return ingredient;
  }

  /**
   * Actualiza un ingrediente, asegurando que solo se modifiquen los de la empresa.
   */
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
      // 1. Se busca el ingrediente DENTRO de la transacción para asegurar que sea manejado por el mismo EntityManager.
      const ingredientToUpdate = await queryRunner.manager.findOne(Ingredient, {
        where: { id, companyId },
        relations: { category: true },
      });

      if (!ingredientToUpdate) {
        throw new NotFoundException(
          `Ingrediente con ID ${id} no encontrado o sin permisos.`,
        );
      }

      const originalStock = ingredientToUpdate.quantityInStock;
      const {
        categoryId,
        category,
        companyId: _dtoCompanyId,
        ...updateData
      } = updateDto;

      // 2. Si se actualiza la categoría, validar su disponibilidad.
      if (categoryId && categoryId !== ingredientToUpdate.category?.id) {
        await this.ingredientCategoryService.validateCategoryAvailability(
          categoryId,
          companyId,
        );
      }
      const newStock = updateDto.quantityInStock;
      const stockChanged = newStock !== undefined && newStock !== originalStock;

      if (stockChanged) {
        const quantityDiff = newStock - originalStock;
        if (quantityDiff !== 0) {
          const stockMovement = queryRunner.manager.create(StockMovement, {
            ingredient: ingredientToUpdate,
            quantity: Math.abs(quantityDiff),
            movementType: quantityDiff > 0 ? MovementType.IN : MovementType.OUT,
            reason: 'Ajuste de stock',
            unit: ingredientToUpdate.unit,
            companyId,
            performedBy: { id: userId },
          });
          await queryRunner.manager.save(stockMovement);
        }
      }

      // Aplicar las actualizaciones y guardar.
      queryRunner.manager.merge(Ingredient, ingredientToUpdate, updateData);

      // Si se proporciona un nuevo categoryId, se actualiza la relación.
      if (updateDto.hasOwnProperty('categoryId')) {
        ingredientToUpdate.category = categoryId
          ? ({ id: categoryId } as IngredientCategory)
          : null;
      }

      await queryRunner.manager.save(ingredientToUpdate);

      await queryRunner.commitTransaction();
      // Se retorna la entidad actualizada. findOneForTenant haría una consulta extra innecesaria.
      // Las relaciones eager como 'category' ya vienen cargadas.
      return ingredientToUpdate;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Elimina un ingrediente, asegurando que solo se puedan eliminar los de la empresa.
   */
  async remove(id: number, companyId: number): Promise<boolean> {
    // Usamos el método `delete` con el filtro estricto de `companyId`.
    const result = await this.ingredientRepo.delete({ id, companyId });

    // Si no se afectó ninguna fila, significa que el ingrediente no se encontró
    // para ese tenant específico.
    if (result.affected === 0) {
      throw new NotFoundException(
        `Ingrediente con ID ${id} no encontrado en su alcance.`,
      );
    }

    return true;
  }
}