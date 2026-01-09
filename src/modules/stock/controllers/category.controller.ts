import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { Tenant } from 'src/common/decorators/tenant-decorator';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles('super_admin', 'company_admin')
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Tenant() tenantId: number | undefined,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;

    // Si no es super_admin, usar el tenantId del usuario autenticado
    if (user.role !== 'super_admin') {
      if (!tenantId) {
        throw new ForbiddenException('No se pudo determinar el tenant');
      }
      return this.categoryService.create(createCategoryDto, tenantId);
    }

    // Super_admin puede especificar el companyId en el DTO si es necesario
    // Por ahora, requerimos que siempre se use el tenantId del usuario
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant');
    }
    return this.categoryService.create(createCategoryDto, tenantId);
  }

  @Get()
  async findAll(@Tenant() tenantId: number | undefined, @Req() req: Request) {
    const user: any = (req as any).user;

    // Los super_admin podrían ver todas las categorías, pero por ahora se restringe al tenant
    if (user.role === 'super_admin') {
      // Opcional: Implementar un método `findAll` sin filtro de tenant si es necesario.
    }

    // El resto de usuarios solo ven las categorías de su tenant
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant');
    }

    return this.categoryService.findAllForTenant(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Tenant() tenantId: number | undefined,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;

    // super_admin puede ver cualquier categoría
    if (user.role === 'super_admin') {
      // Opcional: Implementar un método `findOne` sin filtro de tenant.
    }

    // El resto de usuarios solo pueden ver categorías de su tenant
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant');
    }

    return this.categoryService.findOneForTenant(Number(id), tenantId);
  }

  @Put(':id')
  @Roles('super_admin', 'company_admin')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Tenant() tenantId: number | undefined,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;

    // super_admin puede actualizar cualquier categoría
    if (user.role === 'super_admin') {
      // Opcional: Implementar un método `update` sin filtro de tenant.
    }

    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant');
    }

    return this.categoryService.update(Number(id), updateCategoryDto, tenantId);
  }

  @Delete(':id')
  @Roles('super_admin', 'company_admin')
  async remove(
    @Param('id') id: string,
    @Tenant() tenantId: number | undefined,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;

    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant');
    }

    return this.categoryService.remove(Number(id), tenantId);
  }
}
