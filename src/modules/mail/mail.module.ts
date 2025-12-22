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
      useFactory: async (config: ConfigService) => {
        return {
          transport: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // Obligatorio para puerto 587
            auth: {
              user: config.get<string>('MAIL_USER'),
              pass: config.get<string>('MAIL_PASS'),
            },
            tls: {
              rejectUnauthorized: false, // Ayuda a evitar el timeout en servidores remotos
            },
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
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
