import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    Index
} from 'typeorm';

import { Ingredient } from './ingredient.entity';

@Entity('ingredient_categories')
/**
 * Indice compuesto para asegurar la unicidad del nombre dentro del contexto de un tenant
 * o a nivel global (tenantId = null).
 */
@Index(['companyId', 'name'], { unique: true})
export class IngredientCategory {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * Multi-tenancy: Identificador de la empresa/tenant.
     * Si el valor es NULL, esta es una categoría global y compartida
     * por todas las empresas.
     */
    @Column({ type: 'int', nullable: true }) // <-- Corregido para ser consistente con la lógica de tenant (number)
    companyId: number | null;
    
    /** Nombre de la categoría. */
    @Column({ length: 50, unique: false })
    name: string;

    /** Descripción opcional de la categoría. */
    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    // Relaciones
    @OneToMany(() => Ingredient, (ingredient) => ingredient.category)
    menuItems: Ingredient[];

}