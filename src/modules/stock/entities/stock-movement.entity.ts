import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';
import { MenuItems } from './menu-items.entity';
import { Ingredient } from './ingredient.entity';
import { MovementType, IngredientUnit } from '../enums/enums';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('stock_movements')
export class StockMovement extends BaseTenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => MenuItems, (item) => item.stockMovements, { nullable: true })
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItems | null;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.stockMovements, {
    nullable: true,
  })
  @JoinColumn({ name: 'ingredientId' })
  ingredient: Ingredient | null;

  @Column({ type: 'enum', enum: MovementType })
  movementType: MovementType;

  @Column({ type: 'float' })
  quantity: number;

  @Column({ type: 'float', nullable: true, comment: 'Stock resultante después del movimiento' })
  stockAfter: number | null;

  @Column({ type: 'enum', enum: IngredientUnit })
  unit: IngredientUnit;

  @Column({
    type: 'float',
    nullable: true,
    comment: 'Costo unitario del producto en este movimiento',
  })
  unitCost: number | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Lote del producto',
  })
  lot: string | null;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Fecha de vencimiento del lote',
  })
  expirationDate: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', nullable: true })
  relatedTicketId: string | null;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'performedById' })
  performedBy: User | null;
}
