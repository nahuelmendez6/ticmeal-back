import { Controller, Get, Req, Query, UseGuards, ValidationPipe } from '@nestjs/common';
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
    @Query(new ValidationPipe({ transform: true })) dto: GetStockMovementsReportDto,
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
  async getConsumptionTrend(
    @Query() dto: GetStockMovementsReportDto,
    @Req() req: any,
  ) {
    // Se asume que el tenantId está disponible en el objeto user del request
    // (por ejemplo, extraído de un JWT o guard).
    const tenantId = req.user.companyId; 
    return this.reportsService.getConsumptionTrend(dto, tenantId);
  }

}