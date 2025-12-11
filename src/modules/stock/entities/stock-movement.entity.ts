import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
// Importación ASUMIDA de la entidad base multi-tenant
import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity'; 

import { MenuItems } from './menu-items.entity';
import { Ingredient } from './ingredient.entity';
import { MovementType, IngredientUnit } from '../enums/enums';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('stock_movements')
// Extiende BaseTenantEntity: Hereda id, companyId, y probablemente createdAt/updatedAt
export class StockMovement extends BaseTenantEntity { // <-- AHORA EXTIENDE BaseTenantEntity
  
  @PrimaryGeneratedColumn()
  id: number;
  
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
  // Relaciones (Solo uno de los dos debe estar presente)
  @ManyToOne(() => MenuItems, (item) => item.stockMovements, { nullable: true })
  menuItem: MenuItems | null;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.stockMovements, {
    nullable: true,
  })
  ingredient: Ingredient | null;

  /** Cantidad involucrada. */
  @Column({ type: 'float' })
  quantity: number;

  /** Unidad de medida (debe coincidir con la unidad del item/ingrediente). */
  @Column({ type: 'enum', enum: IngredientUnit })
  unit: IngredientUnit;

  /** Tipo de movimiento. */
  @Column({ type: 'enum', enum: MovementType })
  movementType: MovementType;

  /** Motivo del movimiento ("Producción", "Venta", "Carga inicial"). */
  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  /** ID del ticket/orden relacionado. Se guarda como string para flexibilidad. */
  @Column({ type: 'varchar', nullable: true })
  relatedTicketId: string | null;

  // Relación con el usuario que realizó el movimiento.
  // TypeORM creará la columna 'performedById' automáticamente.
  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'performedById' })
  performedBy: User | null;
}