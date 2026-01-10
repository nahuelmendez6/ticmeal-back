
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shift } from 'src/modules/shift/entities/shift.entity';
import { MenuItemType } from 'src/modules/stock/enums/menuItemTypes';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleDailyMenuCleanup() {
    this.logger.log('Starting daily menu cleanup task...');

    const shifts = await this.shiftRepository.find({
      relations: ['menuItems'],
    });

    let updatedCount = 0;

    for (const shift of shifts) {
      const originalItemCount = shift.menuItems.length;
      
      const simpleItemsOnly = shift.menuItems.filter(
        (item) => item.type === MenuItemType.PRODUCTO_SIMPLE,
      );

      if (simpleItemsOnly.length < originalItemCount) {
        shift.menuItems = simpleItemsOnly;
        await this.shiftRepository.save(shift);
        updatedCount++;
        this.logger.log(`Cleaned composite items from shift: "${shift.name}" (ID: ${shift.id})`);
      }
    }

    if (updatedCount > 0) {
      this.logger.log(`Daily menu cleanup task finished. Cleaned ${updatedCount} shifts.`);
    } else {
      this.logger.log('Daily menu cleanup task finished. No shifts required cleaning.');
    }
  }
}
