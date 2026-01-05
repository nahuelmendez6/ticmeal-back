import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';
import { MenuItems } from './menu-items.entity';
// Verify this path matches your Shift entity location
import { Shift } from 'src/modules/shift/entities/shift.entity';

@Entity('meal_shifts')
export class MealShift extends BaseTenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @ManyToOne(() => Shift)
  @JoinColumn({ name: 'shiftId' })
  shift: Shift;

  @Column()
  shiftId: number;

  @ManyToOne(() => MenuItems)
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItems;

  @Column()
  menuItemId: number;

  @Column({ type: 'float', default: 0 })
  quantityProduced: number;

  @Column({ type: 'float', default: 0 })
  quantityAvailable: number;
}