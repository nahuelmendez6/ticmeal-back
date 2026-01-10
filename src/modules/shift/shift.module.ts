import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shift } from './entities/shift.entity';
import { ShiftService } from './services/shift.service';
import { ShiftController } from './controllers/shift.controller';
import { MenuItems } from '../stock/entities/menu-items.entity';

import { StockModule } from '../stock/stock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shift, MenuItems]),
    forwardRef(() => StockModule),
  ],
  controllers: [ShiftController],
  providers: [ShiftService],
  exports: [ShiftService],
})
export class ShiftModule {}
