import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';
import { Ingredient } from './ingredient.entity';
import { MenuItems } from './menu-items.entity';
import { StockAuditType } from '../enums/stock-audit-type.enum';

@Entity('stock_audits')
export class StockAudit extends BaseTenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: StockAuditType,
    default: StockAuditType.INGREDIENT,
  })
  auditType: StockAuditType;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  auditDate: Date;

  @Column({ type: 'float' })
  theoreticalStock: number;

  @Column({ type: 'float' })
  physicalStock: number;

  @Column({ type: 'float' })
  difference: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCostAtAudit: number;

  @Column({ type: 'text', nullable: true })
  observations: string;

  @ManyToOne(() => Ingredient, { nullable: true })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @Column({ name: 'ingredient_id', nullable: true })
  ingredientId: number;

  @ManyToOne(() => MenuItems, { nullable: true })
  @JoinColumn({ name: 'menu_item_id' })
  menuItem: MenuItems;

  @Column({ name: 'menu_item_id', nullable: true })
  menuItemId: number;
}
