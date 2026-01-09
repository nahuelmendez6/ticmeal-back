// src/modules/tickets/entities/ticket-item.entity.ts
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';
import { Ticket } from './ticket.entity';
import { MenuItems } from 'src/modules/stock/entities/menu-items.entity';

@Entity('ticket_items')
export class TicketItem extends BaseTenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ManyToOne(() => Ticket, (ticket) => ticket.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @ManyToOne(() => MenuItems, { eager: true })
  @JoinColumn({ name: 'menu_item_id' })
  menuItem: MenuItems;
}
