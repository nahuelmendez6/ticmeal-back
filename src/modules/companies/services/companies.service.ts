import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity';
import { CreateCompanyDto } from '../dto/create.company.dto';
import { UpdateCompanyDto } from '../dto/update.company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  async create(dto: CreateCompanyDto): Promise<Company> {
    await this.ensureUnique(dto.name ?? '', dto.taxId ?? '');
    const company = this.companyRepo.create(dto);
    return this.companyRepo.save(company);
  }

  async findAll(): Promise<Company[]> {
    return this.companyRepo.find();
  }

  async findById(id: number): Promise<Company> {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    return company;
  }

  async update(id: number, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findById(id);
    if (dto.name || dto.taxId) {
      await this.ensureUnique(dto.name ?? company.name, dto.taxId ?? company.taxId, id);
    }
    Object.assign(company, dto);
    return this.companyRepo.save(company);
  }

  async deactivate(id: number): Promise<Company> {
    const company = await this.findById(id);
    company.status = 'inactive';
    return this.companyRepo.save(company);
  }

  private async ensureUnique(name: string, taxId: string, excludeId?: number) {
    const qb = this.companyRepo.createQueryBuilder('c')
      .where('(c.name = :name OR c.taxId = :taxId)', { name, taxId });
    if (excludeId) qb.andWhere('c.id != :excludeId', { excludeId });
    const exists = await qb.getOne();
    if (exists) throw new BadRequestException('Nombre o taxId ya en uso');
  }
}
