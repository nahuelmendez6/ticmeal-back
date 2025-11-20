import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from '../entities/ingredient.entity';
import { CreateIngredientDto } from '../dto/create-ingredient.dto';
import { UpdateIngredientDto } from '../dto/update-ingredient.dto';
import { TenantAwareRepository } from 'src/common/repository/tenant-aware.repository';
import { IngredientCategoryService } from './ingredient-category.service';

@Injectable()
export class IngredientService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,
    private readonly ingredientCategoryService: IngredientCategoryService,
  ) {}

  /**
   * Crea un nuevo ingrediente para la empresa.
   * Valida que la categoría del ingrediente (si se proporciona) esté disponible para el tenant.
   */
  async create(
    createDto: CreateIngredientDto,
    companyId: number,
  ): Promise<Ingredient> {
    // Si se incluye una categoría, validar su disponibilidad para el tenant.
    if (createDto.categoryId) {
      await this.ingredientCategoryService.validateCategoryAvailability(
        createDto.categoryId,
        companyId,
      );
    }

    const newIngredient = this.ingredientRepo.create({
      ...createDto,
      companyId: companyId, // Asignar el companyId del tenant
    });

    return this.ingredientRepo.save(newIngredient);
  }

  /**
   * Obtiene todos los ingredientes disponibles para una empresa.
   * Usa el helper TenantAwareRepository para asegurar el filtrado.
   */
  async findAllForTenant(companyId: number): Promise<Ingredient[]> {
    return TenantAwareRepository.findAllByTenant(
      this.ingredientRepo,
      companyId,
      'ingredient',
    );
  }

  /**
   * Busca un ingrediente por ID, verificando que pertenezca al tenant.
   */
  async findOneForTenant(id: number, companyId: number): Promise<Ingredient> {
    const ingredient = await TenantAwareRepository.findOneByTenant(
      this.ingredientRepo,
      id,
      companyId,
      'ingredient',
    );

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
  ): Promise<Ingredient> {
    // 1. findOneForTenant ya valida que el ingrediente pertenezca al tenant.
    const ingredientToUpdate = await this.findOneForTenant(id, companyId);

    // 2. Si se actualiza la categoría, validar su disponibilidad.
    if (updateDto.categoryId && updateDto.categoryId !== ingredientToUpdate.category?.id) {
      await this.ingredientCategoryService.validateCategoryAvailability(
        updateDto.categoryId,
        companyId,
      );
    }

    // 3. Aplicar las actualizaciones y guardar.
    Object.assign(ingredientToUpdate, updateDto);
    return this.ingredientRepo.save(ingredientToUpdate);
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