import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';
import { Ingredient } from 'src/modules/stock/entities/ingredient.entity';
import { MenuItems } from 'src/modules/stock/entities/menu-items.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { WasteReason } from '../enums/waste-reason.enum';
import { IngredientUnit } from 'src/modules/stock/enums/enums';

@Entity('waste_logs')
export class WasteLog extends BaseTenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ingredient, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ingredientId' })
  ingredient: Ingredient | null;

  @Column({ nullable: true })
  ingredientId: number | null;

  @ManyToOne(() => MenuItems, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItems | null;

  @Column({ nullable: true })
  menuItemId: number | null;

  @Column({ type: 'float' })
  quantity: number;

  @Column({ type: 'enum', enum: IngredientUnit })
  unit: IngredientUnit;

  @Column({ type: 'enum', enum: WasteReason })
  reason: WasteReason;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'date' })
  logDate: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'performedById' })
  performedBy: User;

  @Column()
  performedById: number;
}
