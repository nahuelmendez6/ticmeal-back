import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CompaniesService } from '../services/companies.service';
import { UpdateCompanyDto } from '../dto/update.company.dto';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import type { Request } from 'express';
import { Req } from '@nestjs/common';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // Solo super_admin puede listar todas
  @Roles('super_admin')
  @Get()
  listAll() {
    return this.companiesService.findAll();
  }

  // super_admin puede ver cualquiera; company_admin solo la suya
  @Get(':id')
  async getOne(@Param('id') id: string, @Req() req: Request) {
    const companyId = Number(id);
    const user: any = (req as any).user;
    if (user.role !== 'super_admin' && user.company?.id !== companyId) {
      return { statusCode: 403, message: 'Forbidden' };
    }
    return this.companiesService.findById(companyId);
  }

  // super_admin puede editar cualquiera; company_admin solo la suya
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto, @Req() req: Request) {
    const companyId = Number(id);
    const user: any = (req as any).user;
    if (user.role !== 'super_admin' && user.company?.id !== companyId) {
      return { statusCode: 403, message: 'Forbidden' };
    }
    return this.companiesService.update(companyId, dto);
  }

  // desactivar
  @Patch(':id/deactivate')
  @Roles('super_admin')
  deactivate(@Param('id') id: string) {
    return this.companiesService.deactivate(Number(id));
  }
}
