import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { TenantContextService } from './common/context/tenant-context.service';
import { TenantInterceptor } from './common/interceptors/tenant-interceptor';

/**
 * Modulo raiz de la aplicación
 * 
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // carga variables de entorno automaticamtne desde .env
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => getDatabaseConfig(config),
    }),
    AuthModule,
    UsersModule,
    CompaniesModule,
  ],
  providers: [
    TenantContextService,
    TenantInterceptor,
  ],
  exports: [TenantContextService, TenantInterceptor],
})
export class AppModule {}
