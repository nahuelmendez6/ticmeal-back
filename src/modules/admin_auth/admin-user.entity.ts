import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AdminRole } from './admin-role.enum';

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: AdminRole.SUPER_ADMIN,
  })
  role: AdminRole;

  @Column({ default: true })
  isActive: boolean;

  // Aquí podrías agregar relaciones a permisos específicos si deseas un RBAC más granular
  // @ManyToMany(...)
  // permissions: AdminPermission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}