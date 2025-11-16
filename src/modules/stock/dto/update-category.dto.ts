import { PartialType } from "@nestjs/mapped-types";
import { CreateCategoryDto } from "./create-category.dto";

/**
 * DTO para actualizar una categoría (todos los campos son opcionales)
 */

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}