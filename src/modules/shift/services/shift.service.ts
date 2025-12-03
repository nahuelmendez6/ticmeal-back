import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, DataSource } from 'typeorm';
import { Shift } from '../entities/shift.entity';
import { MenuItems } from 'src/modules/stock/entities/menu-items.entity';
import { CreateShiftDto } from '../dto/create-shift.dto';
import { UpdateShiftDto } from '../dto/update-shift.dto';

@Injectable()
export class ShiftService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepo: Repository<Shift>,
    @InjectRepository(MenuItems)
    private readonly menuItemsRepo: Repository<MenuItems>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crea un nuevo turno y asocia los ítems de menú proporcionados.
   * Valida que los ítems de menú pertenezcan a la empresa.
   */
  async create(createDto: CreateShiftDto, companyId: number): Promise<Shift> {
    const { menuItemIds, ...shiftData } = createDto;
    let menuItems: MenuItems[] = [];

    // Si se proporcionan menuItemIds, validarlos y cargarlos.
    if (menuItemIds && menuItemIds.length > 0) {
      menuItems = await this.menuItemsRepo.find({
        where: { id: In(menuItemIds), companyId },
      });

      if (menuItems.length !== menuItemIds.length) {
        throw new BadRequestException(
          'Uno o más ítems de menú no son válidos o no pertenecen a su empresa.',
        );
      }
    }

    const newShift = this.shiftRepo.create({
      ...shiftData,
      companyId,
      menuItems,
    });

    await this.shiftRepo.save(newShift);
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
    return this.shiftRepo.find(
      {
        where: { companyId, menuActive: true },
        relations: ['menuItems'],
        order: { startTime: 'ASC' },
      }
    )
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
    // findOneForTenant valida la pertenencia y carga las relaciones existentes
    const shiftToUpdate = await this.findOneForTenant(id, companyId);
    const { menuItemIds, ...shiftData } = updateDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Actualizar datos del Turno
      queryRunner.manager.merge(Shift, shiftToUpdate, shiftData);

      // Si se proporciona un nuevo array de menuItemIds, reemplazar los existentes.
      if (menuItemIds !== undefined) {
        if (menuItemIds.length > 0) {
          const menuItems = await this.menuItemsRepo.find({
            where: { id: In(menuItemIds), companyId },
          });

          if (menuItems.length !== menuItemIds.length) {
            throw new BadRequestException(
              'Uno o más ítems de menú no son válidos o no pertenecen a su empresa.',
            );
          }
          shiftToUpdate.menuItems = menuItems;
        } else {
          // Si el array está vacío, se eliminan todas las relaciones.
          shiftToUpdate.menuItems = [];
        }
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