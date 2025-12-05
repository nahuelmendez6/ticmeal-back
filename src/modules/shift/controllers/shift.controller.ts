import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ShiftService } from '../services/shift.service';
import { CreateShiftDto } from '../dto/create-shift.dto';
import { UpdateShiftDto } from '../dto/update-shift.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { Tenant } from 'src/common/decorators/tenant-decorator';
import type { Request } from 'express';

@ApiBearerAuth()
@ApiTags('Shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shifts')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo turno' })
  @Roles('company_admin', 'kitchen_admin', 'super_admin')
  async create(
    @Body() createShiftDto: CreateShiftDto,
    @Tenant() tenantId: number,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar la empresa.');
    }
    return this.shiftService.create(createShiftDto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los turnos de la empresa' })
  @Roles('company_admin', 'kitchen_admin', 'diner', 'super_admin')
  async findAll(@Tenant() tenantId: number, @Req() req: Request) {
    const user: any = req.user;

    // Un super_admin podría tener una lógica diferente, pero por ahora,
    // se asume que opera en el contexto de un tenant si está definido.
    if (user.role === 'super_admin' && !tenantId) {
      // Aquí se podría implementar una lógica para listar todos los turnos de todas las empresas.
      // Por ahora, lanzamos un error si no hay un tenantId.
      throw new ForbiddenException(
        'Super admin debe operar en el contexto de una empresa.',
      );
    }

    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar la empresa.');
    }

    return this.shiftService.findAllForTenant(tenantId);
  }

  @Get('menu-active')
  @ApiOperation({ summary: 'Obtener todos los turnos activos de la empresa' })
  @Roles('company_admin', 'kitchen_admin', 'diner', 'super_admin')
  async findActives(@Tenant() tenantId: number, @Req() req: Request) {
    const user: any = req.user;

    return this.shiftService.findActivesShiftForTenant(tenantId);
  }

  @Get('active-by-hour')
  @ApiOperation({
    summary: 'Obtener el turno activo según la hora actual del servidor',
  })
  @Roles('company_admin', 'kitchen_admin', 'diner', 'super_admin')
  async findActiveByCurrentHour(@Tenant() tenantId: number) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar la empresa.');
    }
    // Obtiene la hora actual del servidor
    const now = new Date();
    const hour = now.toTimeString().split(' ')[0];

    return this.shiftService.findActiveShiftByHourForTenant(tenantId, hour);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un turno por ID' })
  @Roles('company_admin', 'kitchen_admin', 'diner', 'super_admin')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Tenant() tenantId: number,
    @Req() req: Request,
  ) {
    const user: any = req.user;

    // El super_admin puede ver cualquier turno, pero el servicio ya filtra por tenant.
    // Para permitirle ver CUALQUIER turno, necesitaríamos un método en el servicio sin filtro de tenant.
    if (!tenantId && user.role !== 'super_admin') {
      throw new ForbiddenException('No se pudo determinar la empresa.');
    }

    return this.shiftService.findOneForTenant(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un turno por ID' })
  @Roles('company_admin', 'kitchen_admin', 'super_admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateShiftDto: UpdateShiftDto,
    @Tenant() tenantId: number,
    @Req() req: Request,
  ) {
    const user: any = req.user;

    if (!tenantId && user.role !== 'super_admin') {
      throw new ForbiddenException('No se pudo determinar la empresa.');
    }

    return this.shiftService.update(id, updateShiftDto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un turno por ID' })
  @Roles('company_admin', 'kitchen_admin', 'super_admin')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Tenant() tenantId: number,
    @Req() req: Request,
  ) {
    const user: any = req.user;

    if (!tenantId && user.role !== 'super_admin') {
      throw new ForbiddenException('No se pudo determinar la empresa.');
    }

    await this.shiftService.remove(id, tenantId);
    return {
      message: `El turno con ID #${id} ha sido eliminado correctamente.`,
      deleted: true,
    };
  }
}