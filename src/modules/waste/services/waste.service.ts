import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WasteLog } from '../entities/waste-log.entity';
import { CreateWasteLogDto } from '../dto/create-waste-log.dto';
import { StockService } from 'src/modules/stock/services/stock.service';
import { IngredientUnit, MovementType } from 'src/modules/stock/enums/enums';
import { IngredientLot } from 'src/modules/stock/entities/ingredient-lot.entity';
import { MenuItemLot } from 'src/modules/stock/entities/menu-item-lot.entity';

@Injectable()
export class WasteService {
  constructor(
    @InjectRepository(WasteLog)
    private readonly wasteLogRepo: Repository<WasteLog>,
    @InjectRepository(IngredientLot)
    private readonly ingredientLotRepo: Repository<IngredientLot>,
    @InjectRepository(MenuItemLot)
    private readonly menuItemLotRepo: Repository<MenuItemLot>,
    private readonly stockService: StockService,
  ) {}

  async createWasteLog(
    createDto: CreateWasteLogDto,
    companyId: number,
    userId: number,
  ): Promise<WasteLog> {
    const { ingredientLotId, menuItemLotId, quantity, reason, logDate } =
      createDto;
    let { unit } = createDto;

    let ingredientId: number | undefined;
    let menuItemId: number | undefined;

    if (ingredientLotId) {
      const ingredientLot = await this.ingredientLotRepo.findOne({
        where: { id: ingredientLotId, companyId },
        relations: ['ingredient'],
      });
      if (!ingredientLot) {
        throw new NotFoundException('Lote de ingrediente no encontrado.');
      }
      ingredientId = ingredientLot.ingredient.id;
      if (!unit) {
        unit = ingredientLot.ingredient.unit;
      }
    } else if (menuItemLotId) {
      const menuItemLot = await this.menuItemLotRepo.findOne({
        where: { id: menuItemLotId, companyId },
        relations: ['menuItem'],
      });
      if (!menuItemLot) {
        throw new NotFoundException('Lote de ítem de menú no encontrado.');
      }
      menuItemId = menuItemLot.menuItem.id;
      if (!unit) {
        unit = IngredientUnit.UNIT;
      }
    }

    // 2. Create the stock movement for the waste
    await this.stockService.registerMovement(
      {
        ingredientId,
        menuItemId,
        ingredientLotId,
        menuItemLotId,
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
      unit,
      companyId,
      performedById: userId,
      logDate: new Date(logDate),
    });

    return this.wasteLogRepo.save(newWasteLog);
  }

  async findAllForTenant(companyId: number): Promise<WasteLog[]> {
    return this.wasteLogRepo.find({
      where: { companyId },
      relations: [
        'ingredientLot',
        'menuItemLot',
        'performedBy',
        'ingredientLot.ingredient',
        'menuItemLot.menuItem',
      ],
      order: {
        logDate: 'DESC',
      },
    });
  }
}
