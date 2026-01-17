import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WasteLog } from '../entities/waste-log.entity';
import { CreateWasteLogDto } from '../dto/create-waste-log.dto';
import { StockService } from 'src/modules/stock/services/stock.service';
import { IngredientService } from 'src/modules/stock/services/ingredient.service';
import { MenuItemService } from 'src/modules/stock/services/menu-item.service';
import { MovementType } from 'src/modules/stock/enums/enums';

@Injectable()
export class WasteService {
  constructor(
    @InjectRepository(WasteLog)
    private readonly wasteLogRepo: Repository<WasteLog>,
    private readonly stockService: StockService,
    private readonly ingredientService: IngredientService,
    private readonly menuItemService: MenuItemService,
  ) {}

  async createWasteLog(
    createDto: CreateWasteLogDto,
    companyId: number,
    userId: number,
  ): Promise<WasteLog> {
    const { ingredientId, menuItemId, quantity, reason, notes, logDate } =
      createDto;

    let unit;

    // 1. Validate entity and get unit
    if (ingredientId) {
      const ingredient = await this.ingredientService.findOneForTenant(
        ingredientId,
        companyId,
      );
      unit = ingredient.unit;
    } else if (menuItemId) {
      await this.menuItemService.findOneForTenant(menuItemId, companyId);
      unit = 'unit'; // MenuItems are always 'unit'
    }

    // 2. Create the stock movement for the waste
    await this.stockService.registerMovement(
      {
        ingredientId,
        menuItemId,
        quantity,
        movementType: MovementType.OUT,
        reason: `Merma: ${reason}`,
      },
      companyId,
      userId,
    );

    // 3. Create and save the waste log
    const newWasteLog = this.wasteLogRepo.create({
      ...createDto,
      companyId,
      performedById: userId,
      logDate: new Date(logDate),
      unit,
    });

    return this.wasteLogRepo.save(newWasteLog);
  }

  async findAllForTenant(companyId: number): Promise<WasteLog[]> {
    return this.wasteLogRepo.find({
      where: { companyId },
      relations: ['ingredient', 'menuItem', 'performedBy'],
      order: {
        logDate: 'DESC',
      },
    });
  }
}
