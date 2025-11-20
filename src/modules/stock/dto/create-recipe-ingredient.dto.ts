import { IsInt, IsNumber, IsPositive } from 'class-validator';

/**
 * DTO para añadir un ingrediente a la receta de un MenuItem.
 */
export class CreateRecipeIngredientDto {
  @IsInt({ message: 'El ID del ítem de menú debe ser un número entero.' })
  menuItemId: number;

  @IsInt({ message: 'El ID del ingrediente debe ser un número entero.' })
  ingredientId: number;

  @IsNumber()
  @IsPositive({ message: 'La cantidad debe ser un número positivo.' })
  quantity: number;
}