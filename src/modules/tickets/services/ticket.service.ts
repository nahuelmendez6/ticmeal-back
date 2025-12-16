import {
  Injectable,
  Inject,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Not, LessThan, Between } from 'typeorm';

import { Ticket, TicketStatus } from '../entities/ticket.entity';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { CreateManualTicketDto } from '../dto/create-manual-ticket.dto';
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
import { TicketGateway } from './ticket.gateway';

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
    private readonly ticketGateway: TicketGateway,
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

    return this.processTicketCreation(user, createTicketDto.menuItemIds, tenantId);
  }

  async createManual(
    dto: CreateManualTicketDto,
    tenantId: number,
  ) {
    if (!dto.userId) {
      throw new BadRequestException('El ID de usuario es requerido para tickets manuales.');
    }

    // 1. Buscar usuario por ID dentro del tenant
    const user = await this.userRepository.findOne({
      where: { id: dto.userId, company: { id: tenantId } },
      relations: ['observations'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // 1. Crear ticket como PENDING primero
    const ticket = await this.processTicketCreation(user, dto.menuItemIds, tenantId, TicketStatus.PENDING);

    // 2. Descontar stock
    await this.deductStockForTicket(ticket, tenantId);

    // 3. Actualizar a USED
    ticket.status = TicketStatus.USED;
    const usedTicket = await this.ticketRepository.save(ticket);
    this.ticketGateway.broadcastTicketUpdate(usedTicket);

    return usedTicket;
  }

  private async processTicketCreation(user: User, menuItemIds: number[], tenantId: number, status: TicketStatus = TicketStatus.PENDING) {
    // 2. Obtener turno activo
    const now = new Date();
    const hour = now.toTimeString().split(' ')[0]; // HH:mm:ss
    const activeShift = await this.shiftService.findActiveShiftByHourForTenant(
      tenantId,
      hour,
    );
    if (!activeShift || activeShift.length === 0) {
      throw new BadRequestException(
        'No hay un turno activo en este momento para registrar el ticket.',
      );
    }

    // 1.1 Validar que el usuario no tenga un ticket activo (no cancelado) en el turno actual
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const existingTicket = await this.ticketRepository.findOne({
      where: {
        user: { id: user.id },
        shift: { id: activeShift[0].id },
        status: Not(TicketStatus.CANCELLED),
        company: { id: tenantId },
        date: Between(todayStart, todayEnd),
      },
    });

    if (existingTicket) {
      throw new BadRequestException(
        'El usuario ya tiene un ticket generado para este turno en el día de hoy. Debe cancelarlo o usarlo antes de generar uno nuevo.',
      );
    }

    // 3. Buscar items y observaciones
    const uniqueMenuItemIds = [...new Set(menuItemIds)];
    const foundItems = await this.menuItemRepository.find({
      where: { id: In(uniqueMenuItemIds) },
      relations: ['recipeIngredients', 'recipeIngredients.ingredient'],
    });
    if (foundItems.length !== uniqueMenuItemIds.length) {
      throw new NotFoundException('Uno o más items no fueron encontrados.');
    }

    const itemsMap = new Map(foundItems.map((item) => [item.id, item]));
    const items = menuItemIds.map((id) => itemsMap.get(id)!);

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
      status: status,
    });

    const savedTicket = await this.ticketRepository.save(newTicket);

    // Cargar todas las relaciones para enviar el objeto completo
    const fullTicket = await this.findOne(savedTicket.id);

    // Emitir el evento a través del gateway
    this.ticketGateway.broadcastNewTicket(fullTicket);

    return fullTicket;
  }

  async markAsUsed(id: number, tenantId: number): Promise<Ticket> {
    const ticket = await this.findOne(id);

    if (ticket.status === TicketStatus.USED) {
      return ticket;
    }

    await this.deductStockForTicket(ticket, tenantId);

    ticket.status = TicketStatus.USED;
    const updatedTicket = await this.ticketRepository.save(ticket);
    this.ticketGateway.broadcastTicketUpdate(updatedTicket);
    return updatedTicket;
  }

  private async deductStockForTicket(ticket: Ticket, tenantId: number) {
    const menuItemIds = ticket.menuItems.map((i) => i.id);
    const uniqueMenuItemIds = [...new Set(menuItemIds)];

    // Recargar items con ingredientes para el descuento de stock
    const foundItemsWithRelations = await this.menuItemRepository.find({
      where: { id: In(uniqueMenuItemIds) },
      relations: ['recipeIngredients', 'recipeIngredients.ingredient'],
    });

    const itemsMap = new Map(foundItemsWithRelations.map((item) => [item.id, item]));
    const itemsToProcess = menuItemIds.map((id) => itemsMap.get(id)!);

    const affectedIngredientIds = new Set<number>();
    const affectedMenuItemIds = new Set<number>();

    // Actualizar stock y registrar movimientos
    for (const item of itemsToProcess) {
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
          affectedIngredientIds.add(ingredient.id);

          const stockMovement = this.stockMovementRepository.create({
            ingredient: ingredient,
            quantity: recipeIngredient.quantity,
            unit: ingredient.unit,
            movementType: MovementType.OUT,
            reason: 'ticket',
            relatedTicketId: ticket.id.toString(),
            performedBy: ticket.user,
            company: { id: tenantId },
          });
          await this.stockMovementRepository.save(stockMovement);
        }
      } else if (item.stock !== null && item.stock !== undefined) {
        // Descontar stock del menu item si no tiene receta y tiene stock definido
        // Usamos decrement para una operación atómica.
        await this.menuItemRepository.decrement({ id: item.id }, 'stock', 1);
        affectedMenuItemIds.add(item.id);

        const stockMovement = this.stockMovementRepository.create({
          menuItem: item,
          quantity: 1,
          unit: 'unit' as any, // Los MenuItems no tienen una unidad definida, se asume 'unit'
          movementType: MovementType.OUT,
          reason: 'ticket',
          relatedTicketId: ticket.id.toString(),
          performedBy: ticket.user,
          company: { id: tenantId },
        });
        await this.stockMovementRepository.save(stockMovement);
      }
    }

    // Verificar alertas de stock mínimo
    await this.checkAndNotifyLowStock(
      Array.from(affectedIngredientIds),
      Array.from(affectedMenuItemIds),
      tenantId,
    );
  }

  async pause(id: number): Promise<Ticket> {
    const ticket = await this.findOne(id);
    ticket.status = TicketStatus.PAUSED;
    const updatedTicket = await this.ticketRepository.save(ticket);
    this.ticketGateway.broadcastTicketUpdate(updatedTicket);
    return updatedTicket;
  }

  async cancel(id: number): Promise<Ticket> {
    const ticket = await this.findOne(id);
    ticket.status = TicketStatus.CANCELLED;
    const updatedTicket = await this.ticketRepository.save(ticket);
    this.ticketGateway.broadcastTicketUpdate(updatedTicket);
    return updatedTicket;
  }

  // Este método debe ser llamado por un Cron Job (ej. cada minuto)
  async checkExpiredTickets() {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const expiredTickets = await this.ticketRepository.find({
      where: {
        status: TicketStatus.PENDING,
        createdAt: LessThan(fifteenMinutesAgo),
      },
    });

    for (const ticket of expiredTickets) {
      ticket.status = TicketStatus.CANCELLED;
      const updatedTicket = await this.ticketRepository.save(ticket);
      // Opcional: notificar también sobre cancelaciones automáticas
      this.ticketGateway.broadcastTicketUpdate(updatedTicket);
    }
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

    const updatedTicket = await this.ticketRepository.save(ticket);
    this.ticketGateway.broadcastTicketUpdate(updatedTicket);

    return updatedTicket;
  }

  async remove(id: number): Promise<void> {
    const result = await this.ticketRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Ticket with ID #${id} not found`);
    }
  }

  private async checkAndNotifyLowStock(
    ingredientIds: number[],
    menuItemIds: number[],
    tenantId: number,
  ) {
    if (ingredientIds.length > 0) {
      const ingredients = await this.ingredientRepository.find({
        where: { id: In(ingredientIds) },
      });
      for (const ingredient of ingredients) {
        if (
          ingredient.minStock !== null &&
          ingredient.quantityInStock <= ingredient.minStock
        ) {
          this.emitLowStockAlert('ingredient', ingredient, tenantId);
        }
      }
    }

    if (menuItemIds.length > 0) {
      const menuItems = await this.menuItemRepository.find({
        where: { id: In(menuItemIds) },
      });
      for (const item of menuItems) {
        if (item.minStock !== null && item.stock <= item.minStock) {
          this.emitLowStockAlert('menuItem', item, tenantId);
        }
      }
    }
  }

  private emitLowStockAlert(type: 'ingredient' | 'menuItem', entity: any, tenantId: number) {
    this.ticketGateway.broadcastLowStockAlert({
      type,
      id: entity.id,
      name: entity.name,
      currentStock: type === 'ingredient' ? entity.quantityInStock : entity.stock,
      minStock: entity.minStock,
      unit: type === 'ingredient' ? entity.unit : 'unit',
      companyId: tenantId,
    });
  }
}