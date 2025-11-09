import { Column, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from 'src/modules/companies/entities/company.entity';

/**
 * Clase base para entidades multi-tenant.
 * 
 * Esta clase define la relacion entre una entidad y la compañia (tenant)
 * a la que pertenece. Cualquier entidad que herede de esta clase quedara
 * vinculada a un registro de la tabla companies
 */

export abstract class BaseTenantEntity {
    /**
     * Relacion ManyToOne con la entidad Company.
     * 
     * - Cada entdidad hija pertenecea a una sola compañia
     * - 'nullable: false' => siempre debe estar asociada a una compañia
     * - 'onDelete: CASCADE' => si se borra una empresa, se eliminan sus registros hijos
     */
    @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE'})
    @JoinColumn({ name: 'company_id' }) // Define la columna que une con la tabla Company
    company: Company;

    /**
     * Columna que guarda el ID de la compañia
     * 
     * - Permite acceder al ID directamente sin necesidad de cargar el objeto Company.
     * - Se usa en filtros  y validaciones de acceso (multi-tenant)
     */
    @Column({ name: 'company_id', type: 'int'})
    companyId: number;
}