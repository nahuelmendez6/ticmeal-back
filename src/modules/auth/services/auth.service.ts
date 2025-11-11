import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from 'src/modules/users/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/modules/users/dto/create.user.dto';
import { CreateCompanyDto } from 'src/modules/companies/dto/create.company.dto';
import { Company } from 'src/modules/companies/entities/company.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Observation } from 'src/modules/users/entities/observation.entity';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../users/enums/user-role.enum';
import { MailService } from 'src/modules/mail/services/mail.service';
import { In } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Observation)
    private readonly observationRepo: Repository<Observation>,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService, 
  ) {}

  // ==============================
  // Registro de usuarios internos
  // ==============================

  async registerKitchenAdmin(userDto: CreateUserDto, currentUser: User) {
    return this.registerCompanyUser(userDto, currentUser, UserRole.KITCHEN_ADMIN);
  }

  async registerCompanyAdmin(userDto: CreateUserDto, currentUser: User) {
    return this.registerCompanyUser(userDto, currentUser, UserRole.COMPANY_ADMIN);
  }

  async registerDiner(userDto: CreateUserDto, currentUser: User) {
    return this.registerCompanyUser(userDto, currentUser, UserRole.DINER);
  }

  // ==============================
  // Registro de nueva empresa + admin
  // ==============================

  async registerCompany(companyDto: CreateCompanyDto, adminDto: CreateUserDto) {
    const exists = await this.companyRepo.findOne({
      where: [{ name: companyDto.name }, { taxId: companyDto.taxId }],
    });
    if (exists)
      throw new BadRequestException(
        'Ya existe una empresa con el mismo nombre o taxId',
      );

    return this.dataSource.transaction(async (manager) => {
      const compRepoTx = manager.getRepository(Company);
      const userRepoTx = manager.getRepository(User);

      const company = compRepoTx.create(companyDto);
      await compRepoTx.save(company);

      const username = `${company.name}@ticmeal`.toLowerCase();

      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(adminDto.password, salt);

      const adminUser = userRepoTx.create({
        ...adminDto,
        username,
        password: passwordHash,
        role: UserRole.COMPANY_ADMIN,
        company,
      });

      const savedAdmin = await userRepoTx.save(adminUser);

      return { company, admin: savedAdmin };
    });
  }

  // ==============================
  // Login
  // ==============================

  async login(username: string, password: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const isValid = user.password
      ? await this.userService.validatePassword(password, user.password)
      : false;

    if (!isValid) throw new UnauthorizedException('Credenciales inválidas');

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      companyId: user.company?.id,
    };

    return { access_token: this.jwtService.sign(payload) };
  }

  // ==============================
  // Métodos privados reutilizables
  // ==============================

  private async registerCompanyUser(
    userDto: CreateUserDto,
    currentUser: User,
    role: UserRole,
  ) {
    // 1. Validar permisos
    this.ensureIsCompanyAdmin(currentUser);

    // 2. Obtener empresa
    const company = await this.getCompanyOrThrow(currentUser.company.id);

    // 3. Verificar duplicados
    await this.ensureEmailIsUnique(userDto.email);

    // 4. Generar username si aplica
    let username: string | undefined;
    if (role !== UserRole.DINER) {
      if (!userDto.firsName)
        throw new BadRequestException(
          'El nombre es obligatorio para crear username',
        );

      username = await this.userService.generateUniqueUsername(
        userDto.firsName,
        company.id,
        company.name,
      );
    }

    // 5. Generar PIN y hash
    const pin = this.generatePin();
    const pinHash = await this.hashPin(pin);

    // 6. Buscar observaciones opcionales (solo del tenant del usuario)
    let observations: Observation[] = [];
    if (userDto.observationsIds && userDto.observationsIds.length > 0) {
      observations = await this.observationRepo.find({
        where: { 
          id: In(userDto.observationsIds),
          companyId: company.id, // Filtrar por tenant
        },
      });
      
      // Verificar que todas las observaciones solicitadas pertenezcan al tenant
      if (observations.length !== userDto.observationsIds.length) {
        throw new BadRequestException(
          'Una o más observaciones no pertenecen a tu empresa o no existen'
        );
      }
    }


    // 7. Crear usuario
    const newUser = this.userRepo.create({
      ...userDto,
      username,
      role,
      company,
      pinHash,
      observations,
    });

    await this.userRepo.save(newUser);

    // Enviar credenciales
    await this.mailService.sendUserCredentials(newUser, company, undefined, pin);

    return newUser;
  }

  private ensureIsCompanyAdmin(user: User) {
    if (user.role !== UserRole.COMPANY_ADMIN) {
      throw new ForbiddenException(
        'Solo los administradores de empresa pueden crear usuarios',
      );
    }
  }

  private async getCompanyOrThrow(companyId: number): Promise<Company> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company)
      throw new BadRequestException('El administrador no tiene una empresa asociada');
    return company;
  }

  private async ensureEmailIsUnique(email: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new BadRequestException('El email ya está registrado');
  }

  private generatePin(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private async hashPin(pin: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(pin, saltRounds);
  }
}
