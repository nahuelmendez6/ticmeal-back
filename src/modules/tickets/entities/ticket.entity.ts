import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  Index,
  CreateDateColumn,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

import { User } from 'src/modules/users/entities/user.entity';
import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';
import { Shift } from 'src/modules/shift/entities/shift.entity';
import { Observation } from 'src/modules/users/entities/observation.entity';
import { TicketItem } from './ticket-item.entity';

export enum TicketStatus {
  PENDING = 'pending', // pendiente
  PAUSED = 'paused', // pausado
  USED = 'used', // usado
  CANCELLED = 'cancelled', // cancelado
}

@Entity('tickets')
export class Ticket extends BaseTenantEntity {
  /**
   * cada usuario puede tener multiples tickets asociados
   * cada ticket puede tener estados: pendiente, cancelado,usado
   */

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.tickets)
  user: User;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.PENDING,
    comment: 'Estado actual del ticket',
  })
  status: TicketStatus;

  @ManyToOne(() => Shift, {
    eager: true,
  })
  @JoinColumn({ name: 'shift_id', referencedColumnName: 'id' })
  shift: Shift | null;

  @Column({ type: 'date', comment: 'Fecha de validez del ticket' })
  date: Date;

  @Column({ type: 'time', comment: 'Hora de validez del ticket' })
  time: string;

  @CreateDateColumn({ comment: 'Fecha y hora de creación del ticket' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora de expiración del ticket',
  })
  expiresAt: Date | null;

  @OneToMany(() => TicketItem, (ticketItem) => ticketItem.ticket, {
    cascade: true,
    eager: true,
  })
  items: TicketItem[];

  @ManyToMany(() => Observation, { eager: true, cascade: true })
  @JoinTable({
    name: 'ticket_observations',
    joinColumn: { name: 'ticket_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'observation_id', referencedColumnName: 'id' },
  })
  observations: Observation[];
}
