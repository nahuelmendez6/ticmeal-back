import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shift } from './entities/shift.entity';
import { ShiftService } from './services/shift.service';
import { ShiftController } from './controllers/shift.controller';
import { MenuItems } from '../stock/entities/menu-items.entity';

import { StockModule } from '../stock/stock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shift, MenuItems]), // Importamos MenuItems para que el servicio pueda usar su repositorio
    StockModule,
  ],
  controllers: [ShiftController],
  providers: [ShiftService],
  exports: [ShiftService], // Exportamos el servicio por si otros módulos necesitan usarlo
})
export class ShiftModule {}
