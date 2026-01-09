import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, DataSource, LessThan, MoreThan } from 'typeorm';
import { Shift } from '../entities/shift.entity';
import { MenuItems } from 'src/modules/stock/entities/menu-items.entity';
import { CreateShiftDto } from '../dto/create-shift.dto';
import { UpdateShiftDto } from '../dto/update-shift.dto';
import { MealShiftService } from 'src/modules/stock/services/meal-shift.service';
import { MenuItemType } from 'src/modules/stock/enums/menuItemTypes';

@Injectable()
export class ShiftService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepo: Repository<Shift>,
    @InjectRepository(MenuItems)
    private readonly menuItemsRepo: Repository<MenuItems>,
    private readonly mealShiftService: MealShiftService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crea un nuevo turno y asocia los ítems de menú proporcionados.
   * Valida que los ítems de menú pertenezcan a la empresa.
   */
  async create(createDto: CreateShiftDto, companyId: number): Promise<Shift> {
    const { menuItemIds, ...shiftData } = createDto;

    // 1. Crear y guardar el turno sin los menu items
    const shiftEntity = this.shiftRepo.create({
      ...shiftData,
      companyId,
    });
    const newShift = await this.shiftRepo.save(shiftEntity);

    // 2. Si se proporcionan menuItemIds, validarlos y asociarlos
    if (menuItemIds && menuItemIds.length > 0) {
      const menuItems = await this.menuItemsRepo.find({
        where: { id: In(menuItemIds), companyId },
      });

      if (menuItems.length !== menuItemIds.length) {
        throw new BadRequestException(
          'Uno o más ítems de menú no son válidos o no pertenecen a su empresa.',
        );
      }

      // 3. Verificación de producción para ítems compuestos
      for (const item of menuItems) {
        if (item.type === MenuItemType.PRODUCTO_COMPUESTO) {
          const isProduced =
            await this.mealShiftService.isMenuItemProducedForShift(
              item.id,
              newShift.id,
              new Date(), // Asumimos la fecha actual para la verificación
              companyId,
            );
          if (!isProduced) {
            throw new BadRequestException(
              `El ítem compuesto "${item.name}" no ha sido producido para este turno y fecha.`,
            );
          }
        }
      }

      // 4. Asociar los menu items y guardar
      newShift.menuItems = menuItems;
      await this.shiftRepo.save(newShift);
    }

    return this.findOneForTenant(newShift.id, companyId);
  }

  /**
   * Obtiene todos los turnos para una empresa, incluyendo los ítems de menú asociados.
   */
  async findAllForTenant(companyId: number): Promise<Shift[]> {
    return this.shiftRepo.find({
      where: { companyId },
      relations: ['menuItems'],
      order: { startTime: 'ASC' },
    });
  }

  /** Obtiene los turnos con menu activo */
  async findActivesShiftForTenant(companyId: number): Promise<Shift[]> {
    return this.shiftRepo.find({
      where: { companyId, menuActive: true },
      relations: ['menuItems'],
      order: { startTime: 'ASC' },
    });
  }

  /** Obtiene los turnos activos en su horario */
  async findActiveShiftByHourForTenant(
    companyId: number,
    hour: string,
  ): Promise<Shift[]> {
    const shifts = await this.shiftRepo.find({
      where: [
        // Turnos que no cruzan la medianoche
        {
          companyId,
          menuActive: true,
          startTime: LessThan(hour),
          endTime: MoreThan(hour),
        },
      ],
      relations: ['menuItems'],
    });

    return shifts;
  }

  /**
   * Busca un turno por ID, verificando que pertenezca a la empresa.
   */
  async findOneForTenant(id: number, companyId: number): Promise<Shift> {
    const shift = await this.shiftRepo.findOne({
      where: { id, companyId },
      relations: ['menuItems'],
    });

    if (!shift) {
      throw new NotFoundException(
        `Turno con ID ${id} no encontrado o sin permisos.`,
      );
    }

    return shift;
  }

  /**
   * Actualiza un turno.
   * La actualización de los ítems de menú es un reemplazo completo.
   */
  async update(
    id: number,
    updateDto: UpdateShiftDto,
    companyId: number,
  ): Promise<Shift> {
    const { menuItemIds, ...shiftData } = updateDto;
    const shiftToUpdate = await this.findOneForTenant(id, companyId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      queryRunner.manager.merge(Shift, shiftToUpdate, shiftData);

      if (menuItemIds !== undefined) {
        let menuItems: MenuItems[] = [];
        if (menuItemIds.length > 0) {
          menuItems = await this.menuItemsRepo.find({
            where: { id: In(menuItemIds), companyId },
          });

          if (menuItems.length !== menuItemIds.length) {
            throw new BadRequestException(
              'Uno o más ítems de menú no son válidos o no pertenecen a su empresa.',
            );
          }

          for (const item of menuItems) {
            if (item.type === MenuItemType.PRODUCTO_COMPUESTO) {
              // aca se evalua sin un item ha sido producido para este turno y fecha
              const isProduced =
                await this.mealShiftService.isMenuItemProducedForShift(
                  item.id,
                  id, // ID del turno que se está actualizando
                  new Date(),
                  companyId,
                );
              if (!isProduced) {
                throw new BadRequestException(
                  `El ítem compuesto "${item.name}" no ha sido producido para este turno y fecha.`,
                );
              }
            }
          }
        }
        shiftToUpdate.menuItems = menuItems;
      }

      await queryRunner.manager.save(shiftToUpdate);
      await queryRunner.commitTransaction();

      return this.findOneForTenant(id, companyId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Elimina un turno. La relación en la tabla join se elimina automáticamente.
   */
  async remove(id: number, companyId: number): Promise<boolean> {
    const result = await this.shiftRepo.delete({ id, companyId });

    if (result.affected === 0) {
      throw new NotFoundException(
        `Turno con ID ${id} no encontrado en su alcance.`,
      );
    }

    return true;
  }
}
