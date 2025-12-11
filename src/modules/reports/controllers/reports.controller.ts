import { Controller, Get, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { GetStockMovementsReportDto } from '../dto/get-stock-movements-report.dto';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('reports')
// @UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('stock-movements')
  @Roles('company_admin', 'kitchen_admin')
  async getStockMovementsReport(
    @Query() dto: GetStockMovementsReportDto,
    @Req() req: any,
  ) {
    // Asumiendo que el tenantId viene en el usuario del request
    const tenantId = req.user?.companyId;
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar la empresa del usuario.');
    }
    return this.reportsService.getStockMovementsReport(dto, tenantId);
  }
}