import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from '../../stock/entities/stock-movement.entity';
import { GetStockMovementsReportDto } from '../dto/get-stock-movements-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
  ) {}

  async getStockMovementsReport(dto: GetStockMovementsReportDto, tenantId: number) {
    const { startDate, endDate, movementType } = dto;

    // Ajustamos la fecha de fin para que incluya todo el día.
    // 'BETWEEN' con fechas puede ser exclusivo en el límite superior (ej: '2025-12-10' se interpreta como '2025-12-10 00:00:00').
    const inclusiveEndDate = `${endDate} 23:59:59`;

    const query = this.stockMovementRepository.createQueryBuilder('movement')
      .leftJoinAndSelect('movement.menuItem', 'menuItem')
      .leftJoinAndSelect('movement.ingredient', 'ingredient')
      .leftJoinAndSelect('movement.performedBy', 'user')
      .where('movement.companyId = :tenantId', { tenantId })
      .andWhere('movement.createdAt BETWEEN :startDate AND :inclusiveEndDate', {
        startDate,
        inclusiveEndDate,
      });

    if (movementType) {
      query.andWhere('movement.movementType = :movementType', { movementType });
    }

    query.orderBy('movement.createdAt', 'DESC');

    return await query.getMany();
  }
}