import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'observations' })
export class Observation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ name: 'icon_name', length: 50 })
  iconName: string;

  @ManyToMany('User', (user: User) => user.observations)
  users: User[];
}
