import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
} from 'typeorm';
import { MenuItems } from './menu-items.entity';
import { Ingredient } from './ingredient.entity';

@Entity('recipe_ingredients')
@Unique(['menuItem', 'ingredient']) // Restricción única de Django
export class RecipeIngredient {
  @PrimaryGeneratedColumn()
  id: number;

  /** Cantidad del ingrediente requerida para 1 unidad del ítem del menú. */
  @Column({ type: 'float' })
  quantity: number;

  // Relaciones
  @ManyToOne(() => MenuItems, (menuItem) => menuItem.recipeIngredients, {
    onDelete: 'CASCADE',
    eager: true, // Cargar automáticamente al obtener un MenuItem
  })
  menuItem: MenuItems;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.recipeIngredients, {
    onDelete: 'CASCADE',
    eager: true, // Cargar automáticamente al obtener un RecipeIngredient
  })
  ingredient: Ingredient;

  // No necesitamos companyId aquí ya que se hereda a través de MenuItem,
  // y la entidad Ingredient tiene su propio companyId para validación cruzada.
}