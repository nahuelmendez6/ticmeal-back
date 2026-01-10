import {
  Controller,
  Get,
  Param,
  UseGuards,
  ForbiddenException,
  ParseIntPipe,
  Post,
  Body,
  Req,
} from '@nestjs/common';
import { StockService } from '../services/stock.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Tenant } from 'src/common/decorators/tenant-decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { CreateStockMovementDto } from '../dto/create-stock-movement.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('ingredient/:id/history')
  @Roles('company_admin', 'kitchen_admin')
  async getIngredientHistory(
    @Param('id', ParseIntPipe) id: number,
    @Tenant() tenantId: number,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.stockService.findHistoryForIngredient(id, tenantId);
  }

  @Get('menu-item/:id/history')
  @Roles('company_admin', 'kitchen_admin')
  async getMenuItemHistory(
    @Param('id', ParseIntPipe) id: number,
    @Tenant() tenantId: number,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.stockService.findHistoryForMenuItem(id, tenantId);
  }

  @Post('movements')
  @Roles('company_admin', 'kitchen_admin')
  async createMovement(
    @Body() createStockMovementDto: CreateStockMovementDto,
    @Tenant() tenantId: number,
    @Req() req: any,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    const { id: userId } = req.user;
    return this.stockService.registerMovement(
      createStockMovementDto,
      tenantId,
      userId,
    );
  }
}
