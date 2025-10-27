import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create.user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>
    ) {}

    async createUser(dto: CreateUserDto): Promise<User> {

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(dto.password, salt);

        const user = this.userRepo.create({...dto, password: hashedPassword });

        return this.userRepo.save(user);
    }

    async validatePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepo.findOne({ where: { email }, relations: ['company'] });
    }

}