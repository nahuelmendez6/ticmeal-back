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
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { MenuItemService } from '../services/menu-item.service';
import { CreateMenuItemDto } from '../dto/create-menu-item-dto';
import { UpdateMenuItemDto } from '../dto/update-menu-item-dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { Tenant } from 'src/common/decorators/tenant-decorator';
import { MenuItems } from '../entities/menu-items.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('menu-items')
export class MenuItemController {
  constructor(private readonly menuItemService: MenuItemService) {}

  /**
   * Crea un nuevo ítem de menú.
   * Accesible solo para administradores de la empresa y de cocina.
   */
  @Post()
  @Roles('company_admin', 'kitchen_admin')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createMenuItemDto: CreateMenuItemDto,
    @Tenant() tenantId: number,
  ): Promise<MenuItems> {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.menuItemService.create(createMenuItemDto, tenantId);
  }

  /**
   * Obtiene todos los ítems de menú del tenant.
   * Accesible para todos los roles autenticados dentro de la empresa.
   */
  @Get()
  @Roles('company_admin', 'kitchen_admin', 'diner')
  async findAll(@Tenant() tenantId: number): Promise<MenuItems[]> {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.menuItemService.findAllForTenant(tenantId);
  }

  /**
   * Obtiene un ítem de menú específico por ID.
   * Accesible para todos los roles autenticados dentro de la empresa.
   */
  @Get(':id')
  @Roles('company_admin', 'kitchen_admin', 'diner')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Tenant() tenantId: number,
  ): Promise<MenuItems> {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.menuItemService.findOneForTenant(id, tenantId);
  }

  /**
   * Actualiza un ítem de menú.
   * Accesible solo para administradores de la empresa y de cocina.
   */
  @Patch(':id')
  @Roles('company_admin', 'kitchen_admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
    @Tenant() tenantId: number,
  ): Promise<MenuItems> {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.menuItemService.update(id, updateMenuItemDto, tenantId);
  }

  /**
   * Elimina un ítem de menú.
   * Accesible solo para administradores de la empresa y de cocina.
   */
  @Delete(':id')
  @Roles('company_admin', 'kitchen_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Tenant() tenantId: number,
  ): Promise<{ message: string }> {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    await this.menuItemService.remove(id, tenantId);
    return { message: `Ítem de menú con ID ${id} eliminado correctamente.` };
  }
}