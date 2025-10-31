import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create.user.dto';
import * as bcrypt from 'bcrypt';
import { Company } from 'src/modules/companies/entities/company.entity';

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
        const hashedPassword = await bcrypt.hash(dto.password, salt);

        const partial: DeepPartial<User> = {
            ...dto,
            password: hashedPassword,
        } as any;
        const user = this.userRepo.create(partial);

        if (dto.companyId) {
            const companyRef = await this.companyRepo.findOne({ where: { id: dto.companyId } });
            if (companyRef) user.company = companyRef;
        }

        return this.userRepo.save(user);
    }

    async generateUniqueUsername(firstName: string, companyId: number, companyName: string): Promise<String> {
        const existingUsers = await this.userRepo.find({
            where: { company: {id: companyId }, username: Like(`${firstName}%@${companyName}`)},
            select: ['username']
        });

        const usedNumbers = existingUsers.map(u => {
            const match = u.username.match(new RegExp(`^${firstName}(\\d*)@${companyName}$`));
            return match && match[1] ? parseInt(match[1]) : 0;
        });

        let suffix = 1;
        while (usedNumbers.includes(suffix)) suffix++;

        return `${firstName}${suffix}@${companyName}`.toLowerCase();
    }

    async findByUsername(username: string) {
        return this.userRepo.findOne({
            where: { username },
            relations: ['company'],
        })
    }

    async validatePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepo.findOne({ where: { email }, relations: ['company'] });
    }

    async findById(id: number): Promise<User | null> {
        return this.userRepo.findOne({ where: { id }, relations: ['company'] });
    }

    async findAllByCompany(companyId: number): Promise<User[]> {
        return this.userRepo.find({ where: { company: { id: companyId } }, relations: ['company'] });
    }

    async findAll(): Promise<User[]> {
        return this.userRepo.find({ relations: ['company'] });
    }

    async remove(id: number): Promise<void> {
        await this.userRepo.delete(id);
    }
}