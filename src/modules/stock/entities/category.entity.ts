import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    Index
} from 'typeorm';

import { MenuItems } from './menu-items.entity';

@Entity('categories')
/**
 * Indice compuesto para asegurar la unicidad del nombre dentro del contexto de un tenant
 * o a nivel global (tenantId = null).
 */
@Index(['companyId', 'name'], { unique: true})
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * Multi-tenancy: Identificador de la empresa/tenant.
     * Si el valor es NULL, esta es una categoría global y compartida
     * por todas las empresas.
     */
    @Column({ type: 'int', nullable: true })
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
    @OneToMany(() => MenuItems, (menuItem) => menuItem.category)
    menuItems: MenuItems[];

}