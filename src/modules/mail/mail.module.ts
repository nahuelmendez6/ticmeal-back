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
          host: 'smtp.gmail.com',
          port: 465,               // Cambiamos a 465
          secure: true,            // TRUE para puerto 465
          auth: {
            user: config.get<string>('MAIL_USER'),
            pass: config.get<string>('MAIL_PASS'), // La clave de 16 letras de Google
          },
          tls: {
            // Esto es vital en Render para evitar que el firewall corte la conexión
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
          },
          connectionTimeout: 20000, // Aumenta a 20 segundos
          greetingTimeout: 20000,
          socketTimeout: 20000,
          dnsV4_only: true, // 10 segundos es suficiente si la ruta está abierta
        },
        defaults: {
          from: `"TicMeal" <${config.get<string>('MAIL_USER')}>`,
        },
        template: {
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
