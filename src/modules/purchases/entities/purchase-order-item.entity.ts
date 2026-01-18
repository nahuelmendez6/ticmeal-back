import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { Ingredient } from 'src/modules/stock/entities/ingredient.entity';
import { MenuItems } from 'src/modules/stock/entities/menu-items.entity';

@Entity('purchase_order_items')
@Check(
  `("ingredientId" IS NOT NULL AND "menuItemId" IS NULL) OR ("ingredientId" IS NULL AND "menuItemId" IS NOT NULL)`,
)
export class PurchaseOrderItem extends BaseTenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PurchaseOrder, (po) => po.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder;

  @ManyToOne(() => Ingredient, { eager: true, nullable: true })
  @JoinColumn({ name: 'ingredientId' })
  ingredient: Ingredient | null;

  @ManyToOne(() => MenuItems, { eager: true, nullable: true })
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItems | null;

  @Column({ type: 'float' })
  quantity: number;

  @Column({ type: 'float' })
  unitCost: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lot: string | null;

  @Column({ type: 'date', nullable: true })
  expirationDate: Date | null;
}
