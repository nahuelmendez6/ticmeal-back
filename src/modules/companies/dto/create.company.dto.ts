import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateCompanyDto {


    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    taxId?: string;

    @IsNotEmpty()
    @IsString()
    industryType: string;

    @IsOptional()
    @IsEmail()
    contactEmail?: string;


    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    city?: string;


    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    postalCode?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    numberOfCanteens?: number;

    @IsOptional()
    canteenCapacity?: number;



}