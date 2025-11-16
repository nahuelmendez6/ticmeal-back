import { IsString, IsInt, IsOptional, IsUUID, Min, IsNumber } from "class-validator";
import { Type } from "class-transformer";

/**
 * DTO para crear un nuevo item del menu
 */
export class CreateMenuItemDto {

    @IsString()
    name: string;

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
    @IsUUID() // Ahora esperamos el UUID de la categoría
    categoryId?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    minStock?: number;

}