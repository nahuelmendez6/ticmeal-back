import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { PurchasesService } from '../services/purchases.service';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { Tenant } from 'src/common/decorators/tenant-decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchases')
@Roles('company_admin', 'kitchen_admin')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  async create(
    @Body() createDto: CreatePurchaseOrderDto,
    @Tenant() tenantId: number,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.purchasesService.create(createDto, tenantId);
  }

  @Get()
  async findAll(@Tenant() tenantId: number) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.purchasesService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Tenant() tenantId: number,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.purchasesService.findOne(id, tenantId);
  }

  @Post(':id/receive')
  async receive(
    @Param('id', ParseIntPipe) id: number,
    @Tenant() tenantId: number,
    @Req() req: any,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    const { id: userId } = req.user;
    return this.purchasesService.receive(id, tenantId, userId);
  }
}
