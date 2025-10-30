import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UsersService } from 'src/modules/users/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/modules/users/dto/create.user.dto';
import { CreateCompanyDto } from 'src/modules/companies/dto/create.company.dto';
import { Company } from 'src/modules/companies/entities/company.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        @InjectRepository(Company)
        private readonly companyRepo: Repository<Company>,
        private readonly userRepo: Repository<User>,
        private readonly dataSource: DataSource,
    ) {}

    async registerKitchenAdmin(userDto: CreateUserDto, currentUser: User) {

        // verificar que el usuario actual es admin de empresa
        if (currentUser.role !== 'company_admin') {
            throw new ForbiddenException('Solo los administradores de empresa pueden crear usuarios diner');
        }

        // obtener la empresa del admin
        const company = await this.companyRepo.findOne({
            where: {id: currentUser.company.id},
        });

        if (!company) {
            throw new BadRequestException('El administrador no tiene una empresa asociada');
        }

        // verificar si ya existe un usuario con el mismo email
        const existing = await this.userRepo.findOne({
            where: {email: userDto.email}
        });
        if (existing) {
            throw new BadRequestException('El email ya esta registrado') 
        }

        // generamos nombre de usuario
        const username = `${userDto.firstName}@${currentUser.company.name}`.toLowerCase();

        // generamos pin
        const pin = Math.floor(1000 + Math.random() * 9000).toString();

        // Hashear pin
        const saltRounds = 10;
        const pinHash = await bcrypt.hash(pin, saltRounds);

        // guardar entidad user(diner)
        const newUser = this.userRepo.create({
            ...userDto,
            role:'kitchen_admin',
            company: currentUser.company,
            pinHash,
        });

        await this.userRepo.save(newUser);


    }

    async registerDiner(userDto: CreateUserDto, currentUser: User) {

        // verificar que el usuario actual es admin de empresa
        if (currentUser.role !== 'company_admin') {
            throw new ForbiddenException('Solo los administradores de empresa pueden crear usuarios diner');
        }

        // obtener la empresa del admin
        const company = await this.companyRepo.findOne({
            where: {id: currentUser.company.id},
        });

        if (!company) {
            throw new BadRequestException('El administrador no tiene una empresa asociada');
        }

        // verificar si ya existe un usuario con el mismo email
        const existing = await this.userRepo.findOne({
            where: {email: userDto.email}
        });
        if (existing) {
            throw new BadRequestException('El email ya esta registrado') 
        }

        // generamos nombre de usuario
        //const username = `${userDto.firstName}@ticmeal`.toLowerCase();

        // generamos pin
        const pin = Math.floor(1000 + Math.random() * 9000).toString();

        // Hashear pin
        const saltRounds = 10;
        const pinHash = await bcrypt.hash(pin, saltRounds);

        // guardar entidad user(diner)
        const newUser = this.userRepo.create({
            ...userDto,
            role:'diner',
            company: currentUser.company,
            pinHash,
        });

        await this.userRepo.save(newUser);

    }

    async registerCompany(companyDto: CreateCompanyDto, adminDto: CreateUserDto) {

        // verificacion rapida
        const exists = await this.companyRepo.findOne({ where: [{ name: companyDto.name }, { taxId: companyDto.taxId }]});
        if (exists) throw new BadRequestException('Ya existe una empresa con el mismo nombre o taxId');

        // transaccion: Crear company + admin atomicamente
        const result = await this.dataSource.transaction(async (manager) => {
            // usar repositorios del manager para que todo quede dentro de la misma tx

            const compRepoTx = manager.getRepository(Company);
            const userRepoTx = manager.getRepository(User);

            const company = compRepoTx.create(companyDto);
            await compRepoTx.save(company);

            // Generar username
            const username = `${company.name}@ticmeal`.toLowerCase();

            const userEntity = userRepoTx.create({
                ...adminDto,
                username,
                role: 'company_admin',
                company,
            });

            const salt = await bcrypt.genSalt();
            userEntity.password = await bcrypt.hash(adminDto.password, salt);

            const savedUser = await userRepoTx.save(userEntity);

            return { company, admin: savedUser };

        });

        return result;
    }

    async login(username: string, password: string) {
        const user = await this.userService.findByUsername(username);
        if (!user) throw new UnauthorizedException('Credenciales inválidas');

        const isValid = user.password ? await this.userService.validatePassword(password, user.password) : false;
        if (!isValid) throw new UnauthorizedException('Credenciales inválidas');

        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role,
            companyId: user.company?.id,
        };

        return { access_token: this.jwtService.sign(payload) };
    }

}