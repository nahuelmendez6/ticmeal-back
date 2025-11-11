import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
} from 'typeorm';
import { Company } from 'src/modules/companies/entities/company.entity';
import { Observation } from './observation.entity';
import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';

@Entity({ name: 'users' })
export class User extends BaseTenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ name: 'pin_hash', length: 255, nullable: true })
  pinHash: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  firsName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({
    type: 'enum',
    enum: ['super_admin', 'company_admin', 'diner', 'kitchen', 'kitchen_admin'],
    default: 'diner',
  })
  role: string;

  @ManyToMany(() => Observation, (observation) => observation.users, {
    cascade: true,
  })
  @JoinTable({
    name: 'user_observations',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'observation_id', referencedColumnName: 'id' },
  })
  observations: Observation[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
