import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company } from 'src/modules/companies/entities/company.entity'

@Entity({ name: 'users'})
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true})
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
        enum: ['super_admin', 'company_admin', 'diner'],
        default: 'diner',
    })
    role: string;

    @ManyToOne(() => Company, (company) => company.users)
    company: Company;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}