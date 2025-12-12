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
} from '@nestjs/common';
import { TicketService } from '../services/ticket.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Tenant } from 'src/common/decorators/tenant-decorator';
import { Public } from 'src/common/decorators/public.decorator';
// import { Roles } from 'src/common/decorators/roles.decorator';

@ApiBearerAuth()
@ApiTags('Tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard) 
  @ApiOperation({ summary: 'Crear un nuevo ticket' })
  create(@Body() createTicketDto: CreateTicketDto, @Tenant() tenantId: number) {
    return this.ticketService.create(createTicketDto, tenantId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll() {
    return this.ticketService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketService.update(id, updateTicketDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.remove(id);
  }

  @Patch(':id/pause')
  @Public()
  @ApiOperation({ summary: 'Pausar un ticket' })
  pause(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.pause(id);
  }

  @Patch(':id/cancel')
  @Public()
  @ApiOperation({ summary: 'Cancelar un ticket' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.cancel(id);
  }

  @Patch(':id/use')
  @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('kitchen_admin', 'company_admin')
  @ApiOperation({ summary: 'Marcar ticket como usado y descontar stock' })
  markAsUsed(@Param('id', ParseIntPipe) id: number, @Tenant() tenantId: number) {
    return this.ticketService.markAsUsed(id, tenantId);
  }
}