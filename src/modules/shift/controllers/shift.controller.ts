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
import { Roles, Public } from 'src/modules/auth/decorators/roles.decorators';
import { Tenant } from 'src/common/decorators/tenant-decorator';
import type { Request } from 'express';

@ApiTags('Shifts')
@Controller('shifts')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  // --- RUTA PÚBLICA (Sin Guards) ---
  @Public()
  @Get('active-by-hour/:tenantId')
  @ApiOperation({
    summary: 'Obtener el turno activo según la hora local GMT-3 (PÚBLICO)',
  })
  async findActiveByCurrentHour(
    @Param('tenantId', ParseIntPipe) tenantId: number,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar la empresa.');
    }

    // Forzamos GMT-3 (Argentina/Chile/Uruguay) sin importar la hora del servidor Render
    const options = {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit' as const,
      minute: '2-digit' as const,
      second: '2-digit' as const,
      hour12: false,
    };

    const hour = new Intl.DateTimeFormat('es-AR', options).format(new Date());

    return this.shiftService.findActiveShiftByHourForTenant(tenantId, hour);
  }

  // --- RUTAS PROTEGIDAS (Requieren Token y Roles) ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @ApiOperation({ summary: 'Obtener todos los turnos de la empresa' })
  @Roles('company_admin', 'kitchen_admin', 'diner', 'super_admin')
  async findAll(@Tenant() tenantId: number, @Req() req: Request) {
    const user: any = req.user;
    if (user.role === 'super_admin' && !tenantId) {
      throw new ForbiddenException(
        'Super admin debe operar en el contexto de una empresa.',
      );
    }
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar la empresa.');
    }
    return this.shiftService.findAllForTenant(tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('menu-active')
  @ApiOperation({ summary: 'Obtener todos los turnos activos de la empresa' })
  @Roles('company_admin', 'kitchen_admin', 'diner', 'super_admin')
  async findActives(@Tenant() tenantId: number) {
    return this.shiftService.findActivesShiftForTenant(tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un turno por ID' })
  @Roles('company_admin', 'kitchen_admin', 'diner', 'super_admin')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Tenant() tenantId: number,
    @Req() req: Request,
  ) {
    const user: any = req.user;
    if (!tenantId && user.role !== 'super_admin') {
      throw new ForbiddenException('No se pudo determinar la empresa.');
    }
    return this.shiftService.findOneForTenant(id, tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
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
