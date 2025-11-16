import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateCategoryDto {
  
  /** Tenant ID o null para categoría global */
  @IsOptional()
  @IsUUID()
  companyId?: string | null;

  /** Nombre obligatorio */
  @IsString()
  @Length(1, 50)
  name: string;

  /** Descripción opcional */
  @IsOptional()
  @IsString()
  description?: string | null;
}
