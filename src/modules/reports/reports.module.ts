import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement, Ticket])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}