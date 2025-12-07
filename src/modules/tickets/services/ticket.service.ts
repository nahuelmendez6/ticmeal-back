import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Ticket } from '../entities/ticket.entity';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { User } from '../../users/entities/user.entity';
import { UsersService } from 'src/modules/users/services/user.service';
import { Shift } from '../../shift/entities/shift.entity';
import { ShiftService } from 'src/modules/shift/services/shift.service';
import { MenuItems } from '../../stock/entities/menu-items.entity';
import { Observation } from '../../users/entities/observation.entity';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(MenuItems)
    private readonly menuItemRepository: Repository<MenuItems>,
    @InjectRepository(Observation)
    private readonly observationRepo: Repository<Observation>,
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly shiftService: ShiftService,
  ) {}

  async create(createTicketDto: CreateTicketDto, tenantId: number) {
    // 1. Buscar usuario por PIN dentro del tenant
    const usersInTenant = await this.userRepository.find({
      where: { company: { id: tenantId } },
      relations: ['observations'],
    });

    let user: User | null = null;
    for (const u of usersInTenant) {
      if (u.pinHash) {
        const isPinValid = await this.usersService.validatePin(createTicketDto.pin, u.pinHash);
        if (isPinValid) {
          user = u;
          break;
        }
      }
    }
    if (!user) {
      throw new UnauthorizedException('PIN incorrecto o usuario no encontrado.');
    }

    // 2. Obtener turno activo
    const now = new Date();
    const hour = now.toTimeString().split(' ')[0]; // HH:mm:ss
    const activeShift = await this.shiftService.findActiveShiftByHourForTenant(
      tenantId,
      hour,
    );
    if (!activeShift || activeShift.length === 0) {
      throw new BadRequestException(
        'No hay un turno activo en este momento para registrar el ticket.'
      );
    }

    // 3. Buscar items y observaciones
    const items = await this.menuItemRepository.findBy({ id: In(createTicketDto.menuItemIds) });
    if (items.length !== createTicketDto.menuItemIds.length) {
      throw new NotFoundException('Uno o más items no fueron encontrados.');
    }

    const observations = user.observations || [];

    // 4. Crear el ticket
    const newTicket = this.ticketRepository.create({
      user,
      shift: activeShift[0],
      menuItems: items,
      observations,
      date: now,
      time: hour,
      company: { id: tenantId },
    });

    return this.ticketRepository.save(newTicket);
  }


  findAll(): Promise<Ticket[]> {
    return this.ticketRepository.find({
      relations: ['user', 'shift', 'menuItems', 'observations'],
    });
  }

  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['user', 'shift', 'menuItems', 'observations'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID #${id} not found`);
    }
    return ticket;
  }

  async update(id: number, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const { menuItemIds , ...ticketData } = updateTicketDto;

    const ticket = await this.ticketRepository.preload({
      id,
      ...ticketData,
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID #${id} not found`);
    }

    if (menuItemIds) {
      ticket.menuItems = await this.menuItemRepository.findBy({ id: In(menuItemIds) });
    }

    ticket.observations = ticket.user.observations || [];

    return this.ticketRepository.save(ticket);
  }

  async remove(id: number): Promise<void> {
    const result = await this.ticketRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Ticket with ID #${id} not found`);
    }
  }
}