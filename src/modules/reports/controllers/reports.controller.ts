import {
  Controller,
  Get,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { Tenant } from 'src/common/decorators/tenant-decorator';
import { ReportsService } from '../services/reports.service';
import { GetStockMovementsReportDto } from '../dto/get-stock-movements-report.dto';

@ApiBearerAuth()
@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('stock-movements')
  @Roles('company_admin', 'kitchen_admin')
  @ApiOperation({ summary: 'Obtener reporte de movimientos de stock' })
  getStockMovementsReport(
    @Query(new ValidationPipe({ transform: true }))
    dto: GetStockMovementsReportDto,
    @Tenant() tenantId: number,
  ) {
    return this.reportsService.getStockMovementsReport(dto, tenantId);
  }

  @Get('most-consumed-items')
  @Roles('company_admin', 'kitchen_admin', 'diner')
  @ApiOperation({ summary: 'Obtener reporte de ítems de menú más consumidos' })
  getMostConsumedItems(
    @Query(new ValidationPipe({ transform: true }))
    dto: GetStockMovementsReportDto,
    @Tenant() tenantId: number,
  ) {
    return this.reportsService.getMostConsumedItems(dto, tenantId);
  }

  @Get('consumption-trend')
  @Roles('company_admin', 'kitchen_admin')
  @ApiOperation({ summary: 'Obtener reporte de tendencia de consumo' })
  getConsumptionTrend(
    @Query(new ValidationPipe({ transform: true }))
    dto: GetStockMovementsReportDto,
    @Tenant() tenantId: number,
  ) {
    return this.reportsService.getConsumptionTrend(dto, tenantId);
  }

  @Get('ingredient-consumption-cost')
  @Roles('company_admin', 'kitchen_admin')
  @ApiOperation({
    summary: 'Obtener evolución del costo de consumo de ingredientes',
  })
  getIngredientConsumptionCostEvolution(
    @Query(new ValidationPipe({ transform: true }))
    dto: GetStockMovementsReportDto,
    @Tenant() tenantId: number,
  ) {
    return this.reportsService.getIngredientConsumptionCostEvolution(
      dto,
      tenantId,
    );
  }

  @Get('menu-item-consumption-cost')
  @Roles('company_admin', 'kitchen_admin')
  @ApiOperation({
    summary: 'Obtener evolución del costo de consumo de items de menú',
  })
  getMenuItemConsumptionCostEvolution(
    @Query(new ValidationPipe({ transform: true }))
    dto: GetStockMovementsReportDto,
    @Tenant() tenantId: number,
  ) {
    return this.reportsService.getMenuItemConsumptionCostEvolution(
      dto,
      tenantId,
    );
  }

  @Get('theoretical-menu-cost')
  @Roles('company_admin', 'kitchen_admin')
  @ApiOperation({
    summary: 'Obtener reporte de Costo Unitario Teórico del Menú',
  })
  getTheoreticalMenuCostReport(@Tenant() tenantId: number) {
    return this.reportsService.getTheoreticalMenuCostReport(tenantId);
  }

  @Get('inventory-value')
  @Roles('company_admin', 'kitchen_admin')
  @ApiOperation({ summary: 'Obtener valor actual del inventario (costo)' })
  getInventoryValueReport(@Tenant() tenantId: number) {
    return this.reportsService.getInventoryValueReport(tenantId);
  }

  @Get('general-summary')
  @Roles('company_admin', 'kitchen_admin')
  @ApiOperation({
    summary: 'Obtener resumen general de todos los reportes para exportación',
  })
  getGeneralReport(
    @Query(new ValidationPipe({ transform: true }))
    dto: GetStockMovementsReportDto,
    @Tenant() tenantId: number,
  ) {
    return this.reportsService.getGeneralReport(dto, tenantId);
  }

  @Get('consumption-vs-cost')
  @Roles('company_admin', 'kitchen_admin')
  @ApiOperation({ summary: 'Obtener reporte de Consumo vs. Costo' })
  getConsumptionVsCostReport(
    @Query(new ValidationPipe({ transform: true }))
    dto: GetStockMovementsReportDto,
    @Tenant() tenantId: number,
  ) {
    return this.reportsService.getConsumptionVsCostReport(dto, tenantId);
  }
}
