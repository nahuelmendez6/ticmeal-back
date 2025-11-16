import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';

import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';

import { IngredientUnit, IngredientCostType } from '../enums/enums';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { StockMovement } from './stock-movement.entity';

@Entity('ingredients')
@Index(['companyId', 'name'], { unique: true })
export class Ingredient extends BaseTenantEntity {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Nombre único. */
  @Column({ length: 50, unique: false }) // La unicidad se maneja con el índice compuesto
  name: string;

  /** Stock disponible (usa Float en lugar de Decimal para consistencia con el modelo Django). */
  @Column({ type: 'float', default: 0 })
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

  /** Cantidad mínima de stock recomendada. */
  @Column({ type: 'float', nullable: true })
  minStock: number | null;

  // Relaciones
  @OneToMany(() => RecipeIngredient, (recipeIngredient) => recipeIngredient.ingredient)
  recipeIngredients: RecipeIngredient[];

  @OneToMany(() => StockMovement, (movement) => movement.ingredient)
  stockMovements: StockMovement[];

}