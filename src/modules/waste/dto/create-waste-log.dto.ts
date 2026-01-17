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

@ValidatorConstraint({ name: 'isOnlyOnePresent', async: false })
export class IsOnlyOnePresentConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return (value && !relatedValue) || (!value && relatedValue);
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `Either ${args.property} or ${relatedPropertyName} must be present, but not both.`;
  }
}

export class CreateWasteLogDto {
  @IsOptional()
  @IsNumber()
  @Validate(IsOnlyOnePresentConstraint, ['menuItemId'])
  ingredientId?: number;

  @IsOptional()
  @IsNumber()
  menuItemId?: number;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsEnum(WasteReason)
  @IsNotEmpty()
  reason: WasteReason;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  logDate: string;
}
