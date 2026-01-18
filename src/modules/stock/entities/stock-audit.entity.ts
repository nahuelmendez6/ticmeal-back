import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';
import { Ingredient } from './ingredient.entity';

@Entity('stock_audits')
export class StockAudit extends BaseTenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

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

  @ManyToOne(() => Ingredient, { nullable: false })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @Column({ name: 'ingredient_id' })
  ingredientId: number;
}
