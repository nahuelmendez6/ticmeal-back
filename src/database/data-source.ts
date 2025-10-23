// src/database/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';

const isCompiled = __filename.endsWith('.js');

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306, // ⚠️ Puerto MySQL
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'nM1258menMa',
  database: process.env.DB_NAME || 'ticmeal_db',
  entities: [path.join(__dirname, '/../modules/**/*.entity' + (isCompiled ? '.js' : '.ts'))],
  migrations: [path.join(__dirname, '/migrations/*' + (isCompiled ? '.js' : '.ts'))],
  synchronize: false,
  logging: true,
});
