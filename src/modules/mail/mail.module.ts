import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './services/mail.service';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get<string>('MAIL_HOST', 'smtp.gmail.com'),
          port: config.get<number>('MAIL_PORT', 587),
          secure: false, // TLS
          auth: {
            user: config.get<string>('MAIL_USER'),
            pass: config.get<string>('MAIL_PASS'), // RECUERDA: Sin espacios
          },
          // AGREGAR ESTO: Ayuda a evitar el ETIMEDOUT en Render
          tls: {
            rejectUnauthorized: false, 
          },
          connectionTimeout: 10000, // 10 segundos
          greetingTimeout: 10000,
        },
        defaults: {
          from: `"TicMeal" <${config.get<string>('MAIL_USER')}>`,
        },
        template: {
          // CAMBIO IMPORTANTE PARA PRODUCCIÓN:
          // En Render/Linux, 'dist' es la carpeta de ejecución, no 'src'.
          dir: join(process.cwd(), 'dist/modules/mail/templates'), 
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
