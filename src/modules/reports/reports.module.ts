import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Ingredient } from '../stock/entities/ingredient.entity';
import { MenuItems } from '../stock/entities/menu-items.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockMovement, Ticket, Ingredient, MenuItems]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
