import { Entity, 
        PrimaryGeneratedColumn, 
        Column, 
        ManyToOne, 
        ManyToMany,
        CreateDateColumn, 
        UpdateDateColumn,
        JoinTable } from 'typeorm';
import { Company } from 'src/modules/companies/entities/company.entity'

import { Observation } from './observation.entity';

@Entity({ name: 'users'})
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, default: null})
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

    @ManyToOne(() => Company, (company) => company.users)
    company: Company;

    @ManyToMany(() => Observation, (observation) => observation.users, { cascade: true })
    @JoinTable({
        name: 'user_observations', // nombre personalizado de la tabla intermedia
        joinColumn: { name: 'user_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'observations_id', referencedColumnName: 'id' },
    })
    observations: Observation[];

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}