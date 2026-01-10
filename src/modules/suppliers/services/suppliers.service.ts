import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
  ) {}

  create(
    createDto: CreateSupplierDto,
    companyId: number,
  ): Promise<Supplier> {
    const newSupplier = this.supplierRepo.create({ ...createDto, companyId });
    return this.supplierRepo.save(newSupplier);
  }

  findAll(companyId: number): Promise<Supplier[]> {
    return this.supplierRepo.find({ where: { companyId } });
  }

  async findOne(id: number, companyId: number): Promise<Supplier> {
    const supplier = await this.supplierRepo.findOneBy({ id, companyId });
    if (!supplier) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado.`);
    }
    return supplier;
  }

  async update(
    id: number,
    updateDto: UpdateSupplierDto,
    companyId: number,
  ): Promise<Supplier> {
    const supplier = await this.findOne(id, companyId);
    this.supplierRepo.merge(supplier, updateDto);
    return this.supplierRepo.save(supplier);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const result = await this.supplierRepo.delete({ id, companyId });
    if (result.affected === 0) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado.`);
    }
  }
}
