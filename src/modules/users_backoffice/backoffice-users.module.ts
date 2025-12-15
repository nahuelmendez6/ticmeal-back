import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackofficeUsersService } from './backoffice-users.service';
import { BackofficeUsersController } from './backoffice-users.controller';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { Observation } from '../users/entities/observation.entity';
import { AdminAuthModule } from '../admin_auth/admin-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company, Observation]),
    AdminAuthModule,
  ],
  controllers: [BackofficeUsersController],
  providers: [BackofficeUsersService],
})
export class BackofficeUsersModule {}