import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TenantAwareRepository } from 'src/common/repository/tenant-aware.repository';
import { Repository, DeepPartial, Like } from 'typeorm';
import { User } from '../entities/user.entity';
import { Company } from 'src/modules/companies/entities/company.entity';
import { CreateUserDto } from '../dto/create.user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = dto.password
      ? await bcrypt.hash(dto.password, salt)
      : null;

    const partial: DeepPartial<User> = {
      ...dto,
      password: hashedPassword,
    } as any;

    const user = this.userRepo.create(partial);

    if (dto.companyId) {
      const companyRef = await this.companyRepo.findOne({
        where: { id: dto.companyId },
      });
      if (companyRef) user.company = companyRef;
    }

    return this.userRepo.save(user);
  }

  async findAllForTenant(companyId: number): Promise<User[]> {
    return TenantAwareRepository.createTenantQueryBuilder(this.userRepo, companyId, 'user')
      .leftJoinAndSelect('user.company', 'company')
      .getMany();
  }

  /**
   * Busca todos los usuarios (solo para super_admin).
   * En producción, considerar remover este método o agregar validación de rol.
   */
  async findAll(): Promise<User[]> {
    return this.userRepo.find({ relations: ['company'] });
  }

  /**
   * Busca un usuario por ID.
   * Para operaciones multi-tenant, usar findByIdForTenant.
   */
  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id }, relations: ['company'] });
  }

  /**
   * Busca un usuario por ID verificando que pertenezca al tenant.
   */
  async findByIdForTenant(id: number, companyId: number): Promise<User | null> {
    return TenantAwareRepository.findOneByTenant(this.userRepo, id, companyId, 'user');
  }

  /**
   * Busca un usuario por email.
   * Para operaciones multi-tenant, usar findByEmailForTenant.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email }, relations: ['company'] });
  }

  /**
   * Busca un usuario por email verificando que pertenezca al tenant.
   */
  async findByEmailForTenant(email: string, companyId: number): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email, companyId },
      relations: ['company'],
    });
  }

  /**
   * Busca un usuario por username.
   * Para operaciones multi-tenant, usar findByUsernameForTenant.
   */
  async findByUsername(username: string) {
    return this.userRepo.findOne({
      where: { username },
      relations: ['company'],
    });
  }

  /**
   * Busca un usuario por username verificando que pertenezca al tenant.
   */
  async findByUsernameForTenant(username: string, companyId: number) {
    return this.userRepo.findOne({
      where: { username, companyId },
      relations: ['company'],
    });
  }

  /**
   * Elimina un usuario por ID.
   * Para operaciones multi-tenant, usar removeForTenant.
   */
  async remove(id: number): Promise<void> {
    await this.userRepo.delete(id);
  }

  /**
   * Elimina un usuario verificando que pertenezca al tenant.
   */
  async removeForTenant(id: number, companyId: number): Promise<boolean> {
    const belongs = await TenantAwareRepository.belongsToTenant(this.userRepo, id, companyId);
    if (!belongs) {
      throw new ForbiddenException('No tienes permiso para eliminar este usuario');
    }
    await this.userRepo.delete(id);
    return true;
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateUniqueUsername(
    firstName: string,
    companyId: number,
    companyName: string,
  ): Promise<string> {
    const existingUsers = await this.userRepo.find({
      where: {
        company: { id: companyId },
        username: Like(`${firstName}%@${companyName}`),
      },
      select: ['username'],
    });

    const usedNumbers = existingUsers.map((u) => {
      const match = u.username.match(
        new RegExp(`^${firstName}(\\d*)@${companyName}$`),
      );
      return match && match[1] ? parseInt(match[1]) : 0;
    });

    let suffix = 1;
    while (usedNumbers.includes(suffix)) suffix++;

    return `${firstName}${suffix}@${companyName}`.toLowerCase();
  }
}
