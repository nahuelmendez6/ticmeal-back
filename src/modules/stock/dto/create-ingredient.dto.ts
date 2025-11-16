import {
  IsOptional,
  IsString,
  IsUUID,
  Length,
  IsNumber,
  IsEnum,
  IsPositive,
  IsNumberString,
} from 'class-validator';
import { IngredientUnit, IngredientCostType } from '../enums/enums';

export class CreateIngredientDto {

  /** Tenant (heredado de BaseTenantEntity) */
  @IsOptional()
  @IsUUID()
  companyId?: string | null;

  /** Nombre */
  @IsString()
  @Length(1, 50)
  name: string;

  /** Stock inicial */
  @IsOptional()
  @IsNumber()
  quantityInStock?: number;

  /** Unidad (enum) */
  @IsEnum(IngredientUnit)
  unit: IngredientUnit;

  /** Costo opcional */
  @IsOptional()
  @IsNumber()
  cost?: number | null;

  /** Tipo de costo opcional */
  @IsOptional()
  @IsEnum(IngredientCostType)
  costType?: IngredientCostType | null;

  /** Descripción */
  @IsOptional()
  @IsString()
  description?: string | null;

  /** Categoría del ingrediente */
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  /** Stock mínimo recomendado */
  @IsOptional()
  @IsNumber()
  minStock?: number | null;
}
