import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MenuItems } from '../entities/menu-items.entity';
import { Category } from '../entities/category.entity';
import { CreateMenuItemDto } from '../dto/create-menu-item-dto';
import { UpdateMenuItemDto } from '../dto/update-menu-item-dto';
import { CategoryService } from './category.service';
import { IngredientService } from './ingredient.service';
import { MovementType } from '../enums/enums';
import { MenuItemType } from '../enums/menuItemTypes';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { MealShiftService } from './meal-shift.service';
import { StockService } from './stock.service';

@Injectable()
export class MenuItemService {
  constructor(
    @InjectRepository(MenuItems)
    private readonly menuItemRepo: Repository<MenuItems>,
    @InjectRepository(RecipeIngredient)
    private readonly recipeIngredientRepo: Repository<RecipeIngredient>,
    private readonly categoryService: CategoryService,
    private readonly ingredientService: IngredientService,
    private readonly mealShiftService: MealShiftService,
    private readonly stockService: StockService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createDto: CreateMenuItemDto,
    companyId: number,
    userId: number,
  ): Promise<MenuItems> {
    const {
      recipeIngredients: recipeDto,
      categoryId,
      // stock is no longer managed here
      ...menuItemData
    } = createDto;

    if (categoryId) {
      await this.categoryService.validateCategoryAvailability(
        categoryId,
        companyId,
      );
    }

    if (recipeDto && recipeDto.length > 0) {
      const ingredientIds = recipeDto.map((ri) => ri.ingredientId);
      const ingredients =
        await this.ingredientService.findAllForTenant(companyId);
      const tenantIngredientIds = ingredients.map((i) => i.id);

      for (const id of ingredientIds) {
        if (!tenantIngredientIds.includes(id)) {
          throw new BadRequestException(
            `El ingrediente con ID ${id} no existe o no pertenece a su empresa.`,
          );
        }
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newMenuItem = queryRunner.manager.create(MenuItems, {
        ...menuItemData,
        companyId,
        category: categoryId ? { id: categoryId } : null,
      });
      const savedMenuItem = await queryRunner.manager.save(newMenuItem);

      if (recipeDto && recipeDto.length > 0) {
        const recipe = recipeDto.map((ri) =>
          queryRunner.manager.create(RecipeIngredient, {
            menuItem: savedMenuItem,
            ingredient: { id: ri.ingredientId },
            quantity: ri.quantity,
          }),
        );
        await queryRunner.manager.save(recipe);
      }
      // Initial stock must now be added via an explicit stock movement, not on creation.

      await queryRunner.commitTransaction();
      return this.findOneForTenant(savedMenuItem.id, companyId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllForTenant(
    companyId: number,
    shiftId?: number,
    date?: Date,
  ): Promise<MenuItems[]> {
    const menuItems = await this.menuItemRepo.find({
      where: { companyId },
      relations: [
        'category',
        'recipeIngredients',
        'recipeIngredients.ingredient',
        'lots', // Eagerly load lots
      ],
      order: { name: 'ASC' },
    });

    for (const item of menuItems) {
      // Calculate stock from lots
      item.stock = item.lots
        ? item.lots.reduce((sum, lot) => sum + lot.quantity, 0)
        : 0;

      let isProduced = item.type !== MenuItemType.PRODUCTO_COMPUESTO;
      if (shiftId && date && item.type === MenuItemType.PRODUCTO_COMPUESTO) {
        isProduced = await this.mealShiftService.isMenuItemProducedForShift(
          item.id,
          shiftId,
          date,
          companyId,
        );
      }
      item.isProduced = isProduced;
    }

    return menuItems;
  }

  async findOneForTenant(id: number, companyId: number): Promise<MenuItems> {
    const menuItem = await this.menuItemRepo.findOne({
      where: { id, companyId },
      relations: [
        'category',
        'recipeIngredients',
        'recipeIngredients.ingredient',
        'lots',
      ],
    });

    if (!menuItem) {
      throw new NotFoundException(
        `Ítem de menú con ID ${id} no encontrado o sin permisos.`,
      );
    }
    
    // Calculate stock from lots
    menuItem.stock = menuItem.lots
      ? menuItem.lots.reduce((sum, lot) => sum + lot.quantity, 0)
      : 0;

    return menuItem;
  }

  async update(
    id: number,
    updateDto: UpdateMenuItemDto,
    companyId: number,
    userId: number,
  ): Promise<MenuItems> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const menuItemToUpdate = await queryRunner.manager.findOne(MenuItems, {
        where: { id, companyId },
      });

      if (!menuItemToUpdate) {
        throw new NotFoundException(`Ítem de menú con ID ${id} no encontrado.`);
      }

      const {
        recipeIngredients: recipeDto,
        categoryId,
        // stock is no longer managed here
        ...menuItemData
      } = updateDto;

      if (categoryId && categoryId !== menuItemToUpdate.category?.id) {
        await this.categoryService.validateCategoryAvailability(
          categoryId,
          companyId,
        );
      }

      queryRunner.manager.merge(MenuItems, menuItemToUpdate, menuItemData);

      if (updateDto.hasOwnProperty('categoryId')) {
        menuItemToUpdate.category = categoryId
          ? ({ id: categoryId } as Category)
          : null;
      }

      await queryRunner.manager.save(menuItemToUpdate);

      if (recipeDto) {
        await queryRunner.manager.delete(RecipeIngredient, {
          menuItem: { id },
        });
        if (recipeDto.length > 0) {
          const newRecipe = recipeDto.map((ri) =>
            queryRunner.manager.create(RecipeIngredient, {
              menuItem: { id },
              ingredient: { id: ri.ingredientId },
              quantity: ri.quantity,
            }),
          );
          await queryRunner.manager.save(newRecipe);
        }
      }

      // The block that caused the error has been removed.
      // Stock adjustments must be done via explicit calls to StockService.

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
    const result = await this.menuItemRepo.delete({ id, companyId });

    if (result.affected === 0) {
      throw new NotFoundException(
        `Ítem de menú con ID ${id} no encontrado en su alcance.`,
      );
    }

    return true;
  }
}

