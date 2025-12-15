import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { Observation } from '../users/entities/observation.entity';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';

@Injectable()
export class BackofficeUsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Observation)
    private readonly observationRepository: Repository<Observation>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { companyId, observationIds, password, ...userData } = createUserDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findOne({
      where: [{ username: userData.username }, { email: userData.email }],
    });
    if (existingUser) {
      throw new ConflictException('El usuario o email ya existe');
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    // Asignar Company
    if (companyId) {
      const company = await this.companyRepository.findOneBy({ id: companyId });
      if (!company) throw new NotFoundException(`Company con ID ${companyId} no encontrada`);
      user.company = company;
    }

    // Asignar Observations
    if (observationIds && observationIds.length > 0) {
      const observations = await this.observationRepository.findBy({
        id: In(observationIds),
      });
      user.observations = observations;
    }

    return this.userRepository.save(user);
  }

  async findAll(): Promise<any[]> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });

    return JSON.parse(JSON.stringify(users));
  }



  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const { companyId, observationIds, password, ...userData } = updateUserDto;

    // Actualizar datos básicos
    Object.assign(user, userData);

    // Actualizar password si se envía
    if (password) {
      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(password, salt);
    }

    // Actualizar Company
    if (companyId !== undefined) {
      if (companyId === null) {
        user.company = null as any;
      } else {
        const company = await this.companyRepository.findOneBy({ id: companyId });
        if (!company) throw new NotFoundException(`Company con ID ${companyId} no encontrada`);
        user.company = company;
      }
    }

    // Actualizar Observations
    if (observationIds) {
      const observations = await this.observationRepository.findBy({ id: In(observationIds) });
      user.observations = observations;
    }

    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    // Soft delete o desactivación
    user.isActive = false;
    await this.userRepository.save(user);
  }
}