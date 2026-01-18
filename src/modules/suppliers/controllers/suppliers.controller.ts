import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { SuppliersService } from '../services/suppliers.service';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Tenant } from 'src/common/decorators/tenant-decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
@Roles('company_admin', 'kitchen_admin')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  create(
    @Body() createSupplierDto: CreateSupplierDto,
    @Tenant() tenantId: number,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.suppliersService.create(createSupplierDto, tenantId);
  }

  @Get()
  findAll(@Tenant() tenantId: number) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.suppliersService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Tenant() tenantId: number) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.suppliersService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @Tenant() tenantId: number,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.suppliersService.update(id, updateSupplierDto, tenantId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Tenant() tenantId: number) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.suppliersService.remove(id, tenantId);
  }
}
