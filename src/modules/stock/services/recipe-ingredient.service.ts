import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { MenuItems } from '../entities/menu-items.entity';
import { Ingredient } from '../entities/ingredient.entity';
import { CreateRecipeIngredientDto } from '../dto/create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../dto/update-recipe-ingredient.dto';

@Injectable()
export class RecipeIngredientService {
  constructor(
    @InjectRepository(RecipeIngredient)
    private readonly recipeIngredientRepo: Repository<RecipeIngredient>,
    @InjectRepository(MenuItems)
    private readonly menuItemRepo: Repository<MenuItems>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,
  ) {}

  /**
   * Añade un ingrediente a la receta de un MenuItem.
   * Valida que tanto el MenuItem como el Ingrediente pertenezcan a la empresa.
   */
  async addIngredientToRecipe(
    createDto: CreateRecipeIngredientDto,
    companyId: number,
  ): Promise<RecipeIngredient> {
    const { menuItemId, ingredientId, quantity } = createDto;

    // 1. Validar que el MenuItem pertenece al tenant
    const menuItem = await this.menuItemRepo.findOneBy({
      id: menuItemId,
      companyId,
    });
    if (!menuItem) {
      throw new NotFoundException(
        `El ítem de menú con ID ${menuItemId} no fue encontrado en su empresa.`,
      );
    }

    // 2. Validar que el Ingrediente pertenece al tenant
    const ingredient = await this.ingredientRepo.findOneBy({
      id: ingredientId,
      companyId,
    });
    if (!ingredient) {
      throw new NotFoundException(
        `El ingrediente con ID ${ingredientId} no fue encontrado en su empresa.`,
      );
    }

    // 3. Verificar que el ingrediente no exista ya en la receta para evitar duplicados
    const existingRecipeIngredient = await this.recipeIngredientRepo.findOneBy({
      menuItem: { id: menuItemId },
      ingredient: { id: ingredientId },
    });

    if (existingRecipeIngredient) {
      throw new BadRequestException(
        `El ingrediente '${ingredient.name}' ya existe en la receta de '${menuItem.name}'.`,
      );
    }

    // 4. Crear y guardar la nueva entrada de la receta
    const newRecipeIngredient = this.recipeIngredientRepo.create({
      menuItem,
      ingredient,
      quantity,
    });

    return this.recipeIngredientRepo.save(newRecipeIngredient);
  }

  /**
   * Obtiene todos los ingredientes de una receta específica.
   */
  async findIngredientsForRecipe(
    menuItemId: number,
    companyId: number,
  ): Promise<RecipeIngredient[]> {
    // Validar que el MenuItem pertenece al tenant
    const menuItem = await this.menuItemRepo.findOneBy({ id: menuItemId, companyId });
    if (!menuItem) {
      throw new NotFoundException(
        `El ítem de menú con ID ${menuItemId} no fue encontrado en su empresa.`,
      );
    }

    return this.recipeIngredientRepo.find({
      where: { menuItem: { id: menuItemId } },
      relations: ['ingredient'],
    });
  }

  /**
   * Actualiza la cantidad de un ingrediente en una receta.
   */
  async updateIngredientQuantity(
    id: number,
    updateDto: UpdateRecipeIngredientDto,
    companyId: number,
  ): Promise<RecipeIngredient> {
    const recipeIngredient = await this.recipeIngredientRepo.findOne({
      where: { id, menuItem: { companyId } },
      relations: ['menuItem'],
    });

    if (!recipeIngredient) {
      throw new NotFoundException(
        `El ingrediente de la receta con ID ${id} no fue encontrado en su empresa.`,
      );
    }

    recipeIngredient.quantity = updateDto.quantity;
    return this.recipeIngredientRepo.save(recipeIngredient);
  }

  /**
   * Elimina un ingrediente de una receta.
   */
  async removeIngredientFromRecipe(id: number, companyId: number): Promise<void> {
    const result = await this.recipeIngredientRepo.delete({
      id,
      menuItem: { companyId },
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `El ingrediente de la receta con ID ${id} no fue encontrado en su empresa.`,
      );
    }
  }
}