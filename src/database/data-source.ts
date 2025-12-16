// src/database/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';

const isCompiled = __filename.endsWith('.js');

export const AppDataSource = new DataSource({
  type: 'postgres', // ⚠️ Cambiado a 'postgres'
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432, // ⚠️ Puerto MySQL
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'nM1258menMa',
  database: process.env.DB_NAME || 'postgres',
  entities: [path.join(__dirname, '/../modules/**/*.entity' + (isCompiled ? '.js' : '.ts'))],
  migrations: [path.join(__dirname, '/migrations/*' + (isCompiled ? '.js' : '.ts'))],
  synchronize: false,
  logging: true,
});
