import {
  Controller,
  Get,
  Param,
  UseGuards,
  ForbiddenException,
  ParseIntPipe,
  Post,
  Body,
} from '@nestjs/common';
import { StockService } from '../services/stock.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Tenant } from 'src/common/decorators/tenant-decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { CreateStockMovementDto } from '../dto/create-stock-movement.dto';
import { CreateStockAuditDto } from '../dto/create-stock-audit.dto';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { User } from 'src/modules/users/entities/user.entity';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('audit')
  @Roles('company_admin', 'kitchen_admin')
  async createAudit(
    @Body() auditData: CreateStockAuditDto,
    @Tenant() tenantId: number,
    @CurrentUser() user: User,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.stockService.handleAudit(auditData, tenantId, user.id);
  }

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
    @CurrentUser() user: User,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.stockService.registerMovement(
      createStockMovementDto,
      tenantId,
      user.id,
    );
  }
}
