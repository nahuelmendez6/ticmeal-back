import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from '../../stock/entities/stock-movement.entity';
import { GetStockMovementsReportDto } from '../dto/get-stock-movements-report.dto';
import { Ticket, TicketStatus } from '../../tickets/entities/ticket.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
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
      });

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
      .andWhere('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('menuItem.id')
      .addGroupBy('menuItem.name')
      .orderBy('totalConsumed', 'DESC')
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
}