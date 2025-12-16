import { IsArray, IsInt, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class CreateManualTicketDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  menuItemIds: number[];
}