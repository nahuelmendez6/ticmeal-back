
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';
import { Ingredient } from './ingredient.entity';
import { StockMovement } from './stock-movement.entity';

@Entity('ingredient_lots')
@Index(['ingredient', 'lotNumber', 'companyId'], { unique: true })
export class IngredientLot extends BaseTenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.lots, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ingredientId' })
  ingredient: Ingredient;

  @Column({ length: 100 })
  lotNumber: string;

  @Column({ type: 'date', nullable: true })
  expirationDate: Date | null;

  @Column({ type: 'float' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;

  @OneToMany(() => StockMovement, (movement) => movement.ingredientLot)
  stockMovements: StockMovement[];
}
