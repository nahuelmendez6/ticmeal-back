import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from './entities/user.entity';
import { UsersService } from "./services/user.service";
import { UsersController } from './controllers/users.controllers';
import { Company } from '../companies/entities/company.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Company])],
    providers: [UsersService],
    controllers: [UsersController],
    exports: [UsersService],
})
export class UsersModule {}