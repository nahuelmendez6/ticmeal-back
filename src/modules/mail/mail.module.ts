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
          port: 587,
          secure: false, // Debe ser false para STARTTLS
          auth: {
            user: config.get<string>('MAIL_USER'),
            pass: config.get<string>('MAIL_PASS'), // Tu código de 16 letras sin espacios
          },
          // --- ESTO ES LO QUE FALTA ---
          tls: {
            rejectUnauthorized: false, // Ignora errores de certificado comunes en Docker/Render
            ciphers: 'SSLv3',         // Fuerza compatibilidad
          },
          connectionTimeout: 20000,   // Sube a 20 segundos
          greetingTimeout: 20000,
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
