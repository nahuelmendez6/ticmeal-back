import { Repository, SelectQueryBuilder, FindOptionsWhere } from 'typeorm';
import { BaseTenantEntity } from '../entities/base-tenant.entity';

/**
 * Clase helper para trabajar con repositorios multi-tenant.
 *
 * No extiende Repository directamente porque TypeORM en NestJS requiere
 * que los repositorios se creen a través de TypeOrmModule.forFeature().
 *
 * En su lugar, proporciona métodos helper estáticos que se pueden usar
 * con cualquier repositorio que trabaje con entidades que extiendan BaseTenantEntity.
 */
export class TenantAwareRepository {
  /**
   * Aplica el filtro de tenant a un QueryBuilder existente.
   *
   * @param qb - QueryBuilder de TypeORM
   * @param companyId - ID de la compañía (tenant)
   * @param alias - Alias de la tabla en la consulta (default: 'entity')
   * @returns QueryBuilder con el filtro de tenant aplicado
   */
  static applyTenantFilter<T extends BaseTenantEntity>(
    qb: SelectQueryBuilder<T>,
    companyId: number,
    alias: string = 'entity',
  ): SelectQueryBuilder<T> {
    return qb.andWhere(`${alias}.companyId = :companyId`, { companyId });
  }

  /**
   * Crea un QueryBuilder con filtro de tenant aplicado.
   *
   * @param repo - Repositorio de TypeORM
   * @param companyId - ID de la compañía (tenant)
   * @param alias - Alias de la tabla en la consulta (default: 'entity')
   * @returns QueryBuilder con el filtro de tenant aplicado
   */
  static createTenantQueryBuilder<T extends BaseTenantEntity>(
    repo: Repository<T>,
    companyId: number,
    alias: string = 'entity',
  ): SelectQueryBuilder<T> {
    const qb = repo.createQueryBuilder(alias);
    return this.applyTenantFilter(qb, companyId, alias);
  }

  /**
   * Busca una entidad por ID verificando que pertenezca al tenant.
   *
   * @param repo - Repositorio de TypeORM
   * @param id - ID de la entidad
   * @param companyId - ID de la compañía (tenant)
   * @param alias - Alias de la tabla (default: 'entity')
   * @returns La entidad encontrada o null
   */
  static async findOneByTenant<T extends BaseTenantEntity>(
    repo: Repository<T>,
    id: number,
    companyId: number,
    alias: string = 'entity',
  ): Promise<T | null> {
    return this.createTenantQueryBuilder(repo, companyId, alias)
      .where(`${alias}.id = :id`, { id })
      .getOne();
  }

  /**
   * Busca todas las entidades de un tenant.
   *
   * @param repo - Repositorio de TypeORM
   * @param companyId - ID de la compañía (tenant)
   * @param alias - Alias de la tabla (default: 'entity')
   * @returns Array de entidades del tenant
   */
  static async findAllByTenant<T extends BaseTenantEntity>(
    repo: Repository<T>,
    companyId: number,
    alias: string = 'entity',
  ): Promise<T[]> {
    return this.createTenantQueryBuilder(repo, companyId, alias).getMany();
  }

  /**
   * Verifica si una entidad pertenece al tenant.
   *
   * @param repo - Repositorio de TypeORM
   * @param id - ID de la entidad
   * @param companyId - ID de la compañía (tenant)
   * @returns true si la entidad pertenece al tenant, false en caso contrario
   */
  static async belongsToTenant<T extends BaseTenantEntity>(
    repo: Repository<T>,
    id: number,
    companyId: number,
  ): Promise<boolean> {
    const entity = await repo.findOne({
      where: { id, companyId } as unknown as FindOptionsWhere<T>,
    });
    return entity !== null;
  }
}
