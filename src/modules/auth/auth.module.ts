import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CompaniesModule } from '../companies/companies.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';
import { Observation } from '../users/entities/observation.entity';
import { MailModule } from '../mail/mail.module'; // 👈 importante para los correos

@Module({
  imports: [
    UsersModule,
    PassportModule,
    CompaniesModule,
    MailModule, 
    TypeOrmModule.forFeature([Company, User, Observation]), 
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET') || 'default_secret';
        const expiresInEnv = configService.get<string>('JWT_EXPIRES_IN');
        const expiresIn = expiresInEnv ? Number(expiresInEnv) : 3600;
        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
