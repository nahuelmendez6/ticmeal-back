import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
// Importación ASUMIDA de la entidad base multi-tenant
import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity'; 

import { MenuItems } from './menu.item';
import { Ingredient } from './ingredient.entity';
import { MovementType, IngredientUnit } from '../enums/enums';

@Entity('stock_movements')
// Extiende BaseTenantEntity: Hereda id, companyId, y probablemente createdAt/updatedAt
export class StockMovement extends BaseTenantEntity { // <-- AHORA EXTIENDE BaseTenantEntity
  
  // Si BaseTenantEntity ya define el ID, elimina esta línea.
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  /**
   * NOTA: companyId y timestamp (ahora createdAt) se HEREDAN de BaseTenantEntity.
   * Por lo tanto, se eliminan las definiciones duplicadas aquí.
   */

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
  @Column({ length: 255, nullable: true })
  reason: string | null;

  /** ID del ticket/orden relacionado (asumiendo que Ticket no está en este módulo). */
  @Column({ type: 'uuid', nullable: true })
  relatedTicketId: string | null;

  /** ID del usuario que realizó la acción (asumiendo AUTH_USER_MODEL). */
  @Column({ type: 'uuid', nullable: true })
  performedById: string | null;
}