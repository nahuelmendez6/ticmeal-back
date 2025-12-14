import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminUser } from './admin-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUser]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ADMIN_SECRET'),
        signOptions: { expiresIn: '8h' }, // Tokens de admin suelen durar menos o lo que requiera la seguridad
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminJwtStrategy, AdminJwtAuthGuard, RolesGuard],
  exports: [JwtModule, AdminJwtAuthGuard, RolesGuard, AdminAuthService],
})
export class AdminAuthModule {}