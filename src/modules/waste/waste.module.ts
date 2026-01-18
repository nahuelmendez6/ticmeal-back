import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WasteLog } from './entities/waste-log.entity';
import { WasteService } from './services/waste.service';
import { WasteController } from './controllers/waste.controller';
import { StockModule } from '../stock/stock.module';
import { IngredientLot } from '../stock/entities/ingredient-lot.entity';
import { MenuItemLot } from '../stock/entities/menu-item-lot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WasteLog, IngredientLot, MenuItemLot]),
    StockModule,
  ],
  controllers: [WasteController],
  providers: [WasteService],
})
export class WasteModule {}
