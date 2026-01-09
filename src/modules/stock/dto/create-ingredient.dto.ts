import {
  IsOptional,
  IsString,
  IsUUID,
  Length,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsPositive,
  IsNumberString,
  IsObject,
} from 'class-validator';
import { IngredientUnit, IngredientCostType } from '../enums/enums';

export class CreateIngredientDto {
  /** Tenant (heredado de BaseTenantEntity) */
  @IsOptional()
  @IsNumber()
  companyId?: number | null;

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
  @IsNumber()
  categoryId?: number | null;

  /**
   * Propiedad enviada por el frontend que no se utiliza en el backend.
   * Se permite para evitar errores de validación, pero se ignora en la lógica del servicio.
   */
  @IsOptional()
  @IsObject()
  category?: any;

  /** Stock mínimo recomendado */
  @IsOptional()
  @IsNumber()
  minStock?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
