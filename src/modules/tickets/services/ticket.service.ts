import {
  Injectable,
  Inject,
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
import { StockMovement } from 'src/modules/stock/entities/stock-movement.entity';
import { MovementType } from 'src/modules/stock/enums/enums';
import { Ingredient } from 'src/modules/stock/entities/ingredient.entity';

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
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
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
    const items = await this.menuItemRepository.find({
      where: { id: In(createTicketDto.menuItemIds) },
      relations: ['recipeIngredients', 'recipeIngredients.ingredient'],
    });
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

const savedTicket = await this.ticketRepository.save(newTicket);

    // 5. Actualizar stock y registrar movimientos
    for (const item of items) {
      if (item.recipeIngredients && item.recipeIngredients.length > 0) {
        // Descontar stock de ingredientes de la receta
        for (const recipeIngredient of item.recipeIngredients) {
          const ingredient = recipeIngredient.ingredient;
          // Usamos decrement para una operación atómica y más segura.
          await this.ingredientRepository.decrement(
            { id: ingredient.id },
            'quantityInStock',
            recipeIngredient.quantity
          );

          const stockMovement = this.stockMovementRepository.create({
            ingredient: ingredient,
            quantity: recipeIngredient.quantity,
            unit: ingredient.unit,
            movementType: MovementType.OUT,
            reason: 'ticket',
            relatedTicketId: savedTicket.id.toString(),
            performedBy: user,
            company: { id: tenantId },
          });
          await this.stockMovementRepository.save(stockMovement);
        }
      } else if (item.minStock !== null) {
        // Descontar stock del menu item si no tiene receta y se traquea su stock (minStock no es nulo)
        // Usamos decrement para una operación atómica.
        await this.menuItemRepository.decrement({ id: item.id }, 'stock', 1);

        const stockMovement = this.stockMovementRepository.create({
          menuItem: item,
          quantity: 1,
          unit: 'unit' as any, // Los MenuItems no tienen una unidad definida, se asume 'unit'
          movementType: MovementType.OUT,
          reason: 'ticket',
          relatedTicketId: savedTicket.id.toString(),
          performedBy: user,
          company: { id: tenantId },
        });
        await this.stockMovementRepository.save(stockMovement);
      }
    }

    return savedTicket;
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