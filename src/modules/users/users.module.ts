import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './services/user.service';
import { ObservationService } from '../users/services/observation.service';
import { UsersController } from './controllers/users.controllers';
import { ObservationController } from './controllers/observation.controller';
import { Observation } from '../users/entities/observation.entity';
import { Company } from '../companies/entities/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Company, Observation])],
  providers: [UsersService, ObservationService],
  controllers: [UsersController, ObservationController],
  exports: [UsersService, ObservationService],
})
export class UsersModule {}
