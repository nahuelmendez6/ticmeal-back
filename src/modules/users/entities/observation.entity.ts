import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Company } from 'src/modules/companies/entities/company.entity';
import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';

@Entity({ name: 'observations' })
export class Observation extends BaseTenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ name: 'icon_name', length: 50 })
  iconName: string;

  @ManyToMany(() => User, (user) => user.observations)
  users: User[];
}
