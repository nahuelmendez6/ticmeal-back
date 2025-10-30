import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
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
        private readonly dataSource: DataSource,
    ) {}

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