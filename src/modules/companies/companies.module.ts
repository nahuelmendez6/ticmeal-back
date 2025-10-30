import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompaniesService } from './services/companies.service';
import { CompaniesController } from './controllers/companies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Company])],
  providers: [CompaniesService],
  controllers: [CompaniesController],
  exports: [CompaniesService, TypeOrmModule],
})
export class CompaniesModule {}
