import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'), // Usará el host del Pooler
        port: parseInt(configService.get('DB_PORT'), 10), // Usará 6543
        username: configService.get('DB_USER'), // Usará el usuario completo
        password: configService.get('DB_PASS'),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // ⬅️ Usar TRUE para crear el esquema en la DB vacía
        migrationsRun: false,
        logging: true,

        // Dejamos la familia forzada a IPv4, aunque con el Pooler podría no ser necesario:
        extra: {
          family: 4,
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
