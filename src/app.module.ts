import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';


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
  ],
})
export class AppModule {}
