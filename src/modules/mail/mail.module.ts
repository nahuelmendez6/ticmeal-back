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
        // --- BLOQUE DE LOGS DE DEPURACIÓN ---
        console.log('=== DEBUG MAIL CONFIGURATION ===');
        console.log('MAIL_HOST:', config.get('MAIL_HOST'));
        console.log('MAIL_PORT:', config.get('MAIL_PORT'));
        console.log('MAIL_FROM:', config.get('MAIL_FROM'));
        console.log('PASS_PREFIX:', config.get('MAIL_PASS')?.substring(0, 5) + '...'); 
        console.log('=================================');

        return {
          transport: {
            // Usamos los valores directamente del config
            host: config.get<string>('MAIL_HOST', 'smtp.resend.com'),
            port: 587,
            secure: false, 
            auth: {
              user: 'resend',
              pass: config.get<string>('MAIL_PASS'), 
            },
            tls: {
              rejectUnauthorized: false,
            },
            connectionTimeout: 20000,
            greetingTimeout: 20000,
          },
          defaults: {
            from: `"TicMeal" <${config.get<string>('MAIL_FROM', 'onboarding@resend.dev')}>`,
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
