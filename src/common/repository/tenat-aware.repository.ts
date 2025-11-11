import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';

export class TenantAwareRepository<T extends ObjectLiteral> extends Repository<T> {

    private alias = 'entity';

    setAlias(a: string) { this.alias = a;}

    // corazon del multitenat, todas las consultas deben tener este filtro
    // agrega el filtro del tenant (companyId) a la consulta
    applyTenantFilter(qb: SelectQueryBuilder<T>, companyId: number) {
        return qb.andWhere(`${this.alias}.companyId = :companyId`, { companyId });
    }

    // devuelve las entidades del tenant
    async findByTenant(options: any, companyId: number) {
        const qb = this.createQueryBuilder(this.alias);
        if (options.where) qb.where(options.where);
        this.applyTenantFilter(qb, companyId);
        // se pueden aplicar mas opciones como order, relation, etc
        return qb.getMany();
    }

    // busca una entidad por id pero si pertenece al tenant
    async findOneByTenant(id: number, companyId: number) {
        return this.createQueryBuilder(this.alias)
            .where(`${this.alias}.id = :id`, { id })
            .andWhere(`${this.alias}.companyId = :companyId`, { companyId })
            .getOne();
    }



}