import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: config.get<string>('DB_HOST') || 'localhost',
  port: config.get<number>('DB_PORT') || 3306,
  username: config.get<string>('DB_USER') || 'root',
  password: config.get<string>('DB_PASS') || 'password',
  database: config.get<string>('DB_NAME') || 'mydatabase',
  autoLoadEntities: true,
  synchronize: true,
  logging: true,
});
