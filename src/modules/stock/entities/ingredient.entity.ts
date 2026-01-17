import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  ManyToOne,
} from 'typeorm';

import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';

import { IngredientUnit, IngredientCostType } from '../enums/enums';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { StockMovement } from './stock-movement.entity';
import { IngredientCategory } from './ingredient-category.entity';
import { IngredientLot } from './ingredient-lot.entity';

@Entity('ingredients')
@Index(['companyId', 'name'], { unique: true })
export class Ingredient extends BaseTenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /** Nombre único. */
  @Column({ length: 50, unique: false }) // La unicidad se maneja con el índice compuesto
  name: string;

  /** Stock disponible (calculado a partir de los lotes). */
  quantityInStock: number;

  /** Unidad de medida del stock. */
  @Column({ type: 'enum', enum: IngredientUnit, default: IngredientUnit.UNIT })
  unit: IngredientUnit;

  /** Costo opcional de compra. */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number | null;

  /** Tipo de cost0: por unidad o por peso/volumen. */
  @Column({ type: 'enum', enum: IngredientCostType, nullable: true })
  costType: IngredientCostType | null;

  /** Descripción opcional. */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Relación ManyToOne con la entidad Category
  @ManyToOne(() => IngredientCategory, (category) => category.menuItems, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true, // Cargar la categoría automáticamente al consultar el MenuItem
  })
  category: IngredientCategory | null;

  /** Cantidad mínima de stock recomendada. */
  @Column({ type: 'float', nullable: true })
  minStock: number | null;

  /** Porcentaje de merma/rendimiento (ej: 20 para 20%) */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  shrinkagePercentage: number;

  // Relaciones
  @OneToMany(
    () => RecipeIngredient,
    (recipeIngredient) => recipeIngredient.ingredient,
  )
  recipeIngredients: RecipeIngredient[];

  @OneToMany(() => StockMovement, (movement) => movement.ingredient)
  stockMovements: StockMovement[];

  @OneToMany(() => IngredientLot, (lot) => lot.ingredient)
  lots: IngredientLot[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
