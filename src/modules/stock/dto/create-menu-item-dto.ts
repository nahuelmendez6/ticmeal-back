import {
  IsString,
  IsInt,
  IsOptional,
  Min,
  IsNumber,
  IsArray,
  ValidateNested,
  IsPositive,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para un ingrediente dentro de la receta de un MenuItem.
 */
class RecipeIngredientDto {
  @IsInt()
  ingredientId: number;

  @IsNumber()
  @IsPositive()
  quantity: number;
}

/**
 * DTO para crear un nuevo item del menu
 */
export class CreateMenuItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock?: number = 0;

  @IsOptional()
  @IsString()
  iconName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cost?: number;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minStock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;


  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  recipeIngredients?: RecipeIngredientDto[];
}