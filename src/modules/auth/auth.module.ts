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

@Module({
    imports: [
    UsersModule,
    PassportModule,
    CompaniesModule,
    TypeOrmModule.forFeature([Company]),
    JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => {
            const secret = configService.get<string>('JWT_SECRET') || 'default_secret';
            const expiresInEnv = configService.get<string>('JWT_EXPIRES_IN');
            const expiresIn = expiresInEnv ? Number(expiresInEnv) : 3600; // segundos

            return {
                secret,
                signOptions: {
                    expiresIn, // número
                },
            };
        },
    }),

    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
})

export class AuthModule {}