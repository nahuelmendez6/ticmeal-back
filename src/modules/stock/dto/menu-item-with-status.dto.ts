import { ApiProperty } from '@nestjs/swagger';
import { MenuItems } from '../entities/menu-items.entity';

export class MenuItemWithStatusDto extends MenuItems {
  @ApiProperty({
    description:
      'Indica si el ítem ha sido producido para el turno y fecha consultados.',
    example: true,
  })
  isProduced: boolean;
}
