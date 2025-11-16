import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateIngredientCategoryDto {

  /** Tenant (o null para categoría global) */
  @IsOptional()
  @IsUUID()
  companyId?: string | null;

  /** Nombre */
  @IsString()
  @Length(1, 50)
  name: string;

  /** Descripción opcional */
  @IsOptional()
  @IsString()
  description?: string | null;
}
