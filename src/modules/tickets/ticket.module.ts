import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketService } from './services/ticket.service';
import { TicketController } from './controllers/ticket.controller';
import { Ticket } from './entities/ticket.entity';
import { User } from '../users/entities/user.entity';
import { Shift } from '../shift/entities/shift.entity';
import { MenuItems } from '../stock/entities/menu-items.entity';
import { Observation } from '../users/entities/observation.entity';
import { UsersModule } from '../users/users.module';
import { ShiftModule } from '../shift/shift.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      User,
      Shift,
      MenuItems,
      Observation,
    ]),
    UsersModule,
    ShiftModule,
  ],
  controllers: [TicketController],
  providers: [TicketService], // TicketService ahora puede inyectar UsersService y ShiftService
})
export class TicketModule {}
