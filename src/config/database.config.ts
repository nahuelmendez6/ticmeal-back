import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.get<string>('DB_HOST') || 'localhost',
  port: config.get<number>('DB_PORT') || 5432,
  username: config.get<string>('DB_USER') || 'postgres',
  password: config.get<string>('DB_PASS') || 'password',
  database: config.get<string>('DB_NAME') || 'mydatabase',
  autoLoadEntities: true,
  synchronize: true,
  logging: true,
});
