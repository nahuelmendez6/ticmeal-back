import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WasteLog } from './entities/waste-log.entity';
import { WasteService } from './services/waste.service';
import { WasteController } from './controllers/waste.controller';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [TypeOrmModule.forFeature([WasteLog]), StockModule],
  controllers: [WasteController],
  providers: [WasteService],
})
export class WasteModule {}
