import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { WasteReason } from '../enums/waste-reason.enum';
import { IngredientUnit } from 'src/modules/stock/enums/enums';

@ValidatorConstraint({ name: 'isOnlyOnePresent', async: false })
export class IsOnlyOnePresentConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints as [string];
    const relatedValue = (args.object as Record<string, unknown>)[
      relatedPropertyName
    ];
    return (!!value && !relatedValue) || (!value && !!relatedValue);
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as [string];
    return `Either ${args.property} or ${relatedPropertyName} must be present, but not both.`;
  }
}

export class CreateWasteLogDto {
  @IsOptional()
  @IsNumber()
  @Validate(IsOnlyOnePresentConstraint, ['menuItemLotId'])
  ingredientLotId?: number;

  @IsOptional()
  @IsNumber()
  menuItemLotId?: number;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsEnum(IngredientUnit)
  @IsOptional()
  unit?: IngredientUnit;

  @IsEnum(WasteReason)
  @IsNotEmpty()
  reason: WasteReason;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  logDate: string;
}
