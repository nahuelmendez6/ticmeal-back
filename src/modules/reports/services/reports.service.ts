import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { StockMovement } from '../../stock/entities/stock-movement.entity';
import { GetStockMovementsReportDto } from '../dto/get-stock-movements-report.dto';
import { Ticket, TicketStatus } from '../../tickets/entities/ticket.entity';
import { Ingredient } from '../../stock/entities/ingredient.entity';
import { MenuItems } from '../../stock/entities/menu-items.entity';
import { MovementType } from '../../stock/enums/enums';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(MenuItems)
    private readonly menuItemRepository: Repository<MenuItems>,
  ) {}

  async getStockMovementsReport(dto: GetStockMovementsReportDto, tenantId: number) {
    const { startDate: startDateStr, endDate: endDateStr, movementType } = dto;

    // Para evitar problemas de zona horaria, es más robusto trabajar con objetos Date.
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setUTCHours(23, 59, 59, 999);

    const query = this.stockMovementRepository.createQueryBuilder('movement')
      .leftJoinAndSelect('movement.menuItem', 'menuItem')
      .leftJoinAndSelect('movement.ingredient', 'ingredient')
      .leftJoinAndSelect('movement.performedBy', 'user')
      .where('movement.companyId = :tenantId', { tenantId })
      .andWhere('movement.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('(menuItem.isActive = :isActive OR ingredient.isActive = :isActive)', { isActive: true });

    if (movementType) {
      query.andWhere('movement.movementType = :movementType', { movementType });
    }

    query.orderBy('movement.createdAt', 'DESC');

    return await query.getMany();
  }

  /**
   * Genera un reporte de los ítems de menú más consumidos en un período, basado en tickets.
   * @param dto - DTO con rango de fechas y límite opcional.
   * @param tenantId - ID del tenant.
   * @returns Un arreglo de objetos con el nombre del ítem y el total consumido.
   */
  async getMostConsumedItems(
    dto: GetStockMovementsReportDto,
    tenantId: number,
  ) {
    const { startDate: startDateStr, endDate: endDateStr, limit = 10 } = dto;

    // Para evitar problemas de zona horaria, es más robusto trabajar con objetos Date.
    // new Date('YYYY-MM-DD') crea una fecha a la medianoche en UTC.
    const startDate = new Date(startDateStr);

    const endDate = new Date(endDateStr);
    // Ajustamos la hora para asegurarnos de que cubra todo el día de fin.
    endDate.setUTCHours(23, 59, 59, 999);

    const query = this.ticketRepository
    .createQueryBuilder('ticket')
    .innerJoin('ticket.menuItems', 'menuItem')
    .select('menuItem.name', 'name')
    .addSelect('COUNT(menuItem.id)', 'totalConsumed')
    .where('ticket.companyId = :tenantId', { tenantId })
    .andWhere('ticket.status = :status', { status: TicketStatus.USED })
    .andWhere('menuItem.isActive = :isActive', { isActive: true })
    .andWhere('ticket.createdAt BETWEEN :startDate AND :endDate', {
      startDate,
      endDate,
    })
    .groupBy('menuItem.id')
    .addGroupBy('menuItem.name')
    .orderBy('COUNT(menuItem.id)', 'DESC')
    .limit(limit);


    const rawReport = await query.getRawMany();
    return rawReport.map((r) => ({
      name: r.name,
      totalConsumed: parseInt(r.totalConsumed, 10),
    }));
  }

  /**
   * Genera un reporte de tendencia de consumo diario por ítem.
   * Muestra la evolución del consumo y permite comparativas.
   * @param dto - DTO con rango de fechas.
   * @param tenantId - ID del tenant.
   * @returns Lista de objetos con fecha, nombre del ítem y cantidad consumida.
   */
  async getConsumptionTrend(dto: GetStockMovementsReportDto, tenantId: number) {
    const { startDate: startDateStr, endDate: endDateStr } = dto;
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setUTCHours(23, 59, 59, 999);

    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .innerJoin('ticket.menuItems', 'menuItem')
      .select('CAST(ticket.createdAt AS DATE)', 'date')
      .addSelect('menuItem.name', 'itemName')
      .addSelect('COUNT(menuItem.id)', 'totalConsumed')
      .where('ticket.companyId = :tenantId', { tenantId })
      .andWhere('ticket.status = :status', { status: TicketStatus.USED })
      .andWhere('menuItem.isActive = :isActive', { isActive: true })
      .andWhere('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('CAST(ticket.createdAt AS DATE)')
      .addGroupBy('menuItem.name')
      .orderBy('date', 'ASC');

    const rawReport = await query.getRawMany();

    return rawReport.map((r) => ({
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
      itemName: r.itemName,
      totalConsumed: parseInt(r.totalConsumed, 10),
    }));
  }

  /**
   * Genera un reporte de la evolución del costo de consumo de ingredientes.
   * Calcula el costo total (cantidad * costo actual) agrupado por día.
   * @param dto - DTO con rango de fechas.
   * @param tenantId - ID del tenant.
   * @returns Lista de objetos con fecha y costo total.
   */
  async getIngredientConsumptionCostEvolution(
    dto: GetStockMovementsReportDto,
    tenantId: number,
  ) {
    const { startDate: startDateStr, endDate: endDateStr } = dto;
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setUTCHours(23, 59, 59, 999);

    const query = this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoin('movement.ingredient', 'ingredient')
      .select('CAST(movement.createdAt AS DATE)', 'date')
      .addSelect('ingredient.name', 'ingredientName')
      .addSelect('SUM(movement.quantity * COALESCE(ingredient.cost, 0))', 'dailyIngredientCost')
      .where('movement.companyId = :tenantId', { tenantId })
      .andWhere('movement.movementType = :type', { type: MovementType.OUT })
      .andWhere('movement.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('movement.ingredientId IS NOT NULL')
      .andWhere('ingredient.isActive = :isActive', { isActive: true })
      .groupBy('CAST(movement.createdAt AS DATE)')
      .addGroupBy('ingredient.name')
      .orderBy('date', 'ASC');

    const rawReport = await query.getRawMany();

    const reportMap = new Map<string, { date: string; totalCost: number; details: { ingredientName: string; cost: number }[] }>();

    for (const row of rawReport) {
      const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date;
      const cost = parseFloat(row.dailyIngredientCost);

      if (!reportMap.has(dateStr)) {
        reportMap.set(dateStr, { date: dateStr, totalCost: 0, details: [] });
      }

      const entry = reportMap.get(dateStr)!;
      entry.totalCost += cost;
      entry.details.push({
        ingredientName: row.ingredientName,
        cost,
      });
    }

    return Array.from(reportMap.values());
  }

  /**
   * Genera un reporte de la evolución del costo de consumo de items de menú.
   * Calcula el costo total (cantidad de tickets * costo del item) agrupado por día.
   * @param dto - DTO con rango de fechas.
   * @param tenantId - ID del tenant.
   * @returns Lista de objetos con fecha, costo total y detalle por item.
   */
  async getMenuItemConsumptionCostEvolution(
    dto: GetStockMovementsReportDto,
    tenantId: number,
  ) {
    const { startDate: startDateStr, endDate: endDateStr } = dto;
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setUTCHours(23, 59, 59, 999);

    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .innerJoin('ticket.menuItems', 'menuItem')
      .select('CAST(ticket.createdAt AS DATE)', 'date')
      .addSelect('menuItem.name', 'menuItemName')
      .addSelect('SUM(COALESCE(menuItem.cost, 0))', 'dailyMenuItemCost')
      .where('ticket.companyId = :tenantId', { tenantId })
      .andWhere('ticket.status = :status', { status: TicketStatus.USED })
      .andWhere('menuItem.isActive = :isActive', { isActive: true })
      .andWhere('ticket.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('CAST(ticket.createdAt AS DATE)')
      .addGroupBy('menuItem.name')
      .orderBy('date', 'ASC');

    const rawReport = await query.getRawMany();

    const reportMap = new Map<string, { date: string; totalCost: number; details: { menuItemName: string; cost: number }[] }>();

    for (const row of rawReport) {
      const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date;
      const cost = parseFloat(row.dailyMenuItemCost);

      if (!reportMap.has(dateStr)) {
        reportMap.set(dateStr, { date: dateStr, totalCost: 0, details: [] });
      }

      const entry = reportMap.get(dateStr)!;
      entry.totalCost += cost;
      entry.details.push({
        menuItemName: row.menuItemName,
        cost,
      });
    }

    return Array.from(reportMap.values());
  }

  async getInventoryValueReport(tenantId: number) {
    // Obtener ingredientes con stock positivo
    const ingredients = await this.ingredientRepository.find({
      where: {
        company: { id: tenantId },
        quantityInStock: MoreThan(0),
        isActive: true,
      },
      relations: ['category'],
    });

    // Obtener items de menú con stock positivo
    const menuItems = await this.menuItemRepository.find({
      where: {
        company: { id: tenantId },
        stock: MoreThan(0),
        isActive: true,
      },
      relations: ['category'],
    });

    let totalInventoryValue = 0;
    const categoryMap = new Map<string, any>();

    const processItem = (name: string, categoryName: string, quantity: number, unitCost: number, type: string) => {
      const value = quantity * unitCost;
      totalInventoryValue += value;

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          category: categoryName,
          totalValue: 0,
          items: [],
        });
      }
      const catEntry = categoryMap.get(categoryName);
      catEntry.totalValue += value;
      catEntry.items.push({
        name,
        type,
        quantity,
        unitCost,
        totalValue: value,
      });
    };

    ingredients.forEach((ing) => processItem(ing.name, ing.category?.name || 'Sin Categoría', ing.quantityInStock, Number(ing.cost || 0), 'ingredient'));
    menuItems.forEach((item) => processItem(item.name, item.category?.name || 'Sin Categoría', item.stock, Number(item.cost || 0), 'menu_item'));

    return {
      totalInventoryValue,
      categories: Array.from(categoryMap.values()),
    };
  }

  /**
   * Agrega todos los reportes en una sola estructura para facilitar la exportación (PDF/Excel).
   * Ejecuta las consultas en paralelo.
   * @param dto - DTO con rango de fechas y filtros.
   * @param tenantId - ID del tenant.
   * @returns Objeto con todos los datos de los reportes.
   */
  async getGeneralReport(dto: GetStockMovementsReportDto, tenantId: number) {
    const [
      stockMovements,
      mostConsumedItems,
      consumptionTrend,
      ingredientCostEvolution,
      menuItemCostEvolution,
      inventoryValue,
    ] = await Promise.all([
      this.getStockMovementsReport(dto, tenantId),
      this.getMostConsumedItems(dto, tenantId),
      this.getConsumptionTrend(dto, tenantId),
      this.getIngredientConsumptionCostEvolution(dto, tenantId),
      this.getMenuItemConsumptionCostEvolution(dto, tenantId),
      this.getInventoryValueReport(tenantId),
    ]);

    return {
      stockMovements,
      mostConsumedItems,
      consumptionTrend,
      ingredientCostEvolution,
      menuItemCostEvolution,
      inventoryValue,
    };
  }
}