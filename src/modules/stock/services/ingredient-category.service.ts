// src/modules/stock/services/ingredient-category.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { IngredientCategory } from '../entities/ingredient-category.entity';
import { CreateIngredientCategoryDto } from '../dto/create-ingredient-category.dto';
import { UpdateIngredientCategoryDto } from '../dto/update-ingredient-category.dto';

@Injectable()
export class IngredientCategoryService {
  constructor(
    @InjectRepository(IngredientCategory)
    private readonly ingredientCategoryRepo: Repository<IngredientCategory>,
  ) {}

  /**
   * Crea una nueva categoría de ingrediente personalizada para la empresa.
   */
  async create(
    createDto: CreateIngredientCategoryDto,
    companyId: number,
  ): Promise<IngredientCategory> {
    const newCategory = this.ingredientCategoryRepo.create({
      ...createDto,
      companyId: companyId, // Asigna el companyId para que sea una categoría personalizada
    });

    return this.ingredientCategoryRepo.save(newCategory);
  }

  /**
   * Obtiene todas las categorías de ingredientes para una empresa (Globales + Personalizadas).
   */
  async findAllForTenant(tenantId: number): Promise<IngredientCategory[]> {
    return this.ingredientCategoryRepo.find({
      where: [{ companyId: IsNull() }, { companyId: tenantId }],
      order: {
        name: 'ASC',
      },
    });
  }

  /**
   * Busca una categoría de ingrediente por ID, verificando que sea global o del tenant.
   */
  async findOneForTenant(
    id: number,
    companyId: number,
  ): Promise<IngredientCategory> {
    const category = await this.ingredientCategoryRepo.findOne({
      where: [
        { id: id, companyId: companyId },
        { id: id, companyId: IsNull() },
      ],
    });

    if (!category) {
      throw new NotFoundException(
        'Categoría de ingrediente no encontrada o sin permisos.',
      );
    }

    return category;
  }

  /**
   * Valida si una categoría de ingrediente está disponible para la empresa.
   */
  async validateCategoryAvailability(
    categoryId: number,
    companyId: number,
  ): Promise<IngredientCategory> {
    return this.findOneForTenant(categoryId, companyId);
  }

  /**
   * Actualiza una categoría de ingrediente, asegurando que solo se modifiquen las propias de la empresa.
   */
  async update(
    id: number,
    updateDto: UpdateIngredientCategoryDto,
    companyId: number,
  ): Promise<IngredientCategory> {
    const categoryToUpdate = await this.ingredientCategoryRepo.findOne({
      where: { id, companyId },
    });

    if (!categoryToUpdate) {
      const existsGlobally = await this.ingredientCategoryRepo.findOne({
        where: { id, companyId: IsNull() },
      });
      if (existsGlobally) {
        throw new ForbiddenException(
          `No tienes permiso para modificar la categoría global "${existsGlobally.name}".`,
        );
      }
      throw new NotFoundException(
        `Categoría de ingrediente con ID ${id} no encontrada.`,
      );
    }

    Object.assign(categoryToUpdate, updateDto);

    return this.ingredientCategoryRepo.save(categoryToUpdate);
  }

  /**
   * Elimina una categoría de ingrediente, asegurando que solo se puedan eliminar las propias de la empresa.
   */
  async remove(id: number, companyId: number): Promise<boolean> {
    const result = await this.ingredientCategoryRepo.delete({ id, companyId });

    if (result.affected === 0) {
      const existsGlobally = await this.ingredientCategoryRepo.findOne({
        where: { id, companyId: IsNull() },
      });

      if (existsGlobally) {
        throw new ForbiddenException(
          'No tienes permiso para eliminar esta categoría global.',
        );
      }

      throw new NotFoundException(
        `Categoría de ingrediente con ID ${id} no encontrada en su alcance.`,
      );
    }

    return true;
  }
}
