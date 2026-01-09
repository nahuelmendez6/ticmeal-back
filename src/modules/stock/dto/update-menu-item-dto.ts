import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuItemDto } from './create-menu-item-dto';

/**
 * DTO para actualizar un item del menu (todos los campos son opcionales)
 */

export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {}
