import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne, 
  Index,
} from 'typeorm';

import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';
import { Category } from './category.entity';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { StockMovement } from './stock-movement.entity';

@Entity('menu_items')

/**
 * Extiende BaseTenantEntity: Hereda la columna companyId (no nullable)
 */
export class MenuItems extends BaseTenantEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50, unique: false})
    name: string;

    /** Cantidad disponible. */
    @Column({ type: 'int', default: 0 })
    stock: number;

    /** Nombre del ícono asociado (opcional). */
    @Column({type: 'varchar', length: 100, nullable: true })
    iconName: string | null;

    /** Costo por unidad (precio de venta). */
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    cost: number | null;

    // Relación ManyToOne con la entidad Category
    @ManyToOne(() => Category, (category) => category.menuItems, {
        nullable: true,
        onDelete: 'SET NULL', 
        eager: true, // Cargar la categoría automáticamente al consultar el MenuItem
    })
    category: Category | null;

    /** Cantidad mínima de stock recomendada. */
    @Column({ type: 'int', nullable: true })
    minStock: number | null;

    @Column({ type: 'boolean', default: false })
    isCooked: boolean;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    /** cantudad maxima de item permitido en una orden */
    @Column({ type: 'int', nullable: true})
    maxOrder: number | null;

    // Relaciones
    @OneToMany(() => RecipeIngredient, (recipeIngredient) => recipeIngredient.menuItem)
    recipeIngredients: RecipeIngredient[];

    @OneToMany(() => StockMovement, (movement) => movement.menuItem)
    stockMovements: StockMovement[];

}