import { IsNumber, IsPositive } from 'class-validator';

/**
 * DTO para actualizar la cantidad de un ingrediente en una receta.
 */
export class UpdateRecipeIngredientDto {
  @IsNumber()
  @IsPositive({ message: 'La cantidad debe ser un número positivo.' })
  quantity: number;
}
