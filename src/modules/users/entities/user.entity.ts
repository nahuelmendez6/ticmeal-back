import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company } from 'src/modules/companies/entities/company.entity'

@Entity({ name: 'users'})
export class User {
    
}