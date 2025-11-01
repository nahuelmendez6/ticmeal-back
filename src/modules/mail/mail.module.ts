import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './services/mail.service';

@Module({
  imports: [
    ConfigModule, // Asegúrate de importar ConfigModule globalmente en AppModule si no lo hiciste
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get<string>('MAIL_HOST', 'smtp.gmail.com'),
          port: config.get<number>('MAIL_PORT', 587),
          secure: false, // true para 465, false para 587
          auth: {
            user: config.get<string>('MAIL_USER'),
            pass: config.get<string>('MAIL_PASS'),
          },
        },
        defaults: {
          from: `"TicMeal" <${config.get<string>('MAIL_USER')}>`,
        },
        template: {
          dir: join(process.cwd(), 'src/modules/mail/templates'), // Ruta absoluta a src
          adapter: new HandlebarsAdapter(), // Handlebars
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
