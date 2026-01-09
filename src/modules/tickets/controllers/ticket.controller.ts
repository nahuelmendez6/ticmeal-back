import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { TicketService } from '../services/ticket.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { CreateManualTicketDto } from '../dto/create-manual-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Tenant } from 'src/common/decorators/tenant-decorator';
// IMPORTANTE: Asegúrate de que esta ruta sea la misma que usas en AuthController
import { Public } from 'src/modules/auth/decorators/roles.decorators';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Public() // <-- Hacemos el método público
  @Post('public/:tenantId') // <-- Agregamos tenantId a la ruta para identificar la empresa
  @ApiOperation({ summary: 'Crear un nuevo ticket (PÚBLICO)' })
  createPublic(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body() createTicketDto: CreateTicketDto,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar la empresa.');
    }
    return this.ticketService.create(createTicketDto, tenantId);
  }

  // --- RUTAS PROTEGIDAS ---

  @ApiBearerAuth()
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Crear un nuevo ticket (Admin)' })
  create(@Body() createTicketDto: CreateTicketDto, @Tenant() tenantId: number) {
    return this.ticketService.create(createTicketDto, tenantId);
  }

  @ApiBearerAuth()
  @Post('manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Crear un ticket manual asignado a un usuario' })
  createManual(
    @Body() createManualTicketDto: CreateManualTicketDto,
    @Tenant() tenantId: number,
  ) {
    return this.ticketService.createManual(createManualTicketDto, tenantId);
  }

  @ApiBearerAuth()
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll() {
    return this.ticketService.findAll();
  }

  @ApiBearerAuth()
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.findOne(id);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketService.update(id, updateTicketDto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.remove(id);
  }

  @Public()
  @Patch(':id/pause')
  @ApiOperation({ summary: 'Pausar un ticket' })
  pause(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.pause(id);
  }

  @Public()
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar un ticket' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.cancel(id);
  }

  @ApiBearerAuth()
  @Patch(':id/use')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Marcar ticket como usado y descontar stock' })
  markAsUsed(
    @Param('id', ParseIntPipe) id: number,
    @Tenant() tenantId: number,
  ) {
    return this.ticketService.markAsUsed(id, tenantId);
  }
}
