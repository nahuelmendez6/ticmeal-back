import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { WasteReason } from '../enums/waste-reason.enum';
import { IngredientUnit } from 'src/modules/stock/enums/enums';
import { IngredientLot } from 'src/modules/stock/entities/ingredient-lot.entity';
import { MenuItemLot } from 'src/modules/stock/entities/menu-item-lot.entity';

@Entity('waste_logs')
export class WasteLog extends BaseTenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => IngredientLot, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ingredientLotId' })
  ingredientLot: IngredientLot | null;

  @Column({ nullable: true })
  ingredientLotId: number | null;

  @ManyToOne(() => MenuItemLot, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'menuItemLotId' })
  menuItemLot: MenuItemLot | null;

  @Column({ nullable: true })
  menuItemLotId: number | null;

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
