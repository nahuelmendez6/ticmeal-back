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
          host: config.get<string>('MAIL_HOST', 'smtp.resend.com'),
          port: 587,
          secure: false, 
          auth: {
            user: 'resend',
            pass: config.get<string>('MAIL_PASS'), 
          },
          tls: {
            rejectUnauthorized: false,
            // Eliminamos SSLv3 para usar TLS moderno que requiere Resend
          },
          connectionTimeout: 20000,
          greetingTimeout: 20000,
        },
        defaults: {
          // IMPORTANTE: Asegúrate que MAIL_FROM en Render sea 'onboarding@resend.dev' 
          // o tu dominio verificado. No uses 'resend' aquí.
          from: `"TicMeal" <${config.get<string>('MAIL_FROM', 'onboarding@resend.dev')}>`,
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
