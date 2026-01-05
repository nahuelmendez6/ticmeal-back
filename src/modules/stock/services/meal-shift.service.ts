import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealShift } from '../entities/meal-shift.entity';
import { CreateMealShiftDto } from '../dto/create-meal-shift.dto';
import { UpdateMealShiftDto } from '../dto/update-meal-shift.dto';

@Injectable()
export class MealShiftService {
  constructor(
    @InjectRepository(MealShift)
    private readonly mealShiftRepository: Repository<MealShift>,
  ) {}

  async create(createMealShiftDto: CreateMealShiftDto, companyId: number): Promise<MealShift> {
    const mealShift = this.mealShiftRepository.create({
      ...createMealShiftDto,
      companyId,
      // Si no se especifica disponible, es igual a lo producido inicialmente
      quantityAvailable: createMealShiftDto.quantityAvailable ?? createMealShiftDto.quantityProduced,
    });
    return await this.mealShiftRepository.save(mealShift);
  }

  async findAll(companyId: number): Promise<MealShift[]> {
    return await this.mealShiftRepository.find({
      where: { companyId },
      relations: ['shift', 'menuItem'],
      order: { date: 'DESC' },
    });
  }

  async findOne(id: number, companyId: number): Promise<MealShift> {
    const mealShift = await this.mealShiftRepository.findOne({
      where: { id, companyId },
      relations: ['shift', 'menuItem'],
    });

    if (!mealShift) {
      throw new NotFoundException(`MealShift with ID ${id} not found`);
    }

    return mealShift;
  }

  async update(id: number, updateMealShiftDto: UpdateMealShiftDto, companyId: number): Promise<MealShift> {
    const mealShift = await this.findOne(id, companyId);
    const updated = this.mealShiftRepository.merge(mealShift, updateMealShiftDto);
    return await this.mealShiftRepository.save(updated);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const mealShift = await this.findOne(id, companyId);
    await this.mealShiftRepository.remove(mealShift);
  }
}