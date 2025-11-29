import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity'

@Entity({ name: 'companies' })
export class Company {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, default: null })
    name: string;   // public name

    @Column({ unique: true,nullable: true,default: null})
    taxId: string; // CUIT/CUIL

    @Column({ nullable: true , default: null})
    industryType: string

    @Column({ nullable:true })
    contactEmail: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    state: string;

    @Column({ nullable: true })
    postalCode: string;

    @Column({ nullable: true })
    country: string;

    @Column({ nullable: true })
    numberOfCanteens: number;

    @Column({ nullable: true })
    canteenCapacity: number;

    @Column({ default: 'active' })
    status: string;

    @OneToMany(() => User, (user) => user.company)
    users: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;


}