import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from 'src/modules/users/entities/user.entity';
import { Company } from 'src/modules/companies/entities/company.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

    async sendUserCredentials(
    user: User,
    company: Company,
    plainPassword?: string,
    pin?: string,
    ) {
        try {
            await this.mailerService.sendMail({
            to: user.email,
            subject: `Bienvenido a ${company.name}`,
            template: 'user-credentials', // nombre del archivo sin .hbs
            context: {
                firstName: user.firsName ?? 'usuario',
                username: user.username ?? user.email,
                password: plainPassword,
                pin: pin,
                companyName: company.name,
            },
            });
        } catch (error) {
            console.error(`Error enviando email a ${user.email}:`, error);
        }
    }

    async sendVerificationCode(
        user: User,
        company: Company,
        verificationCode: string
    ) {
        try {
            await this.mailerService.sendMail({
                to: user.email,
                subject: `Código de verificación para ${company.name}`,
                template: 'email-verification', // nombre del archivo sin .hbs
                context: {
                    firstName: user.firsName ?? 'usuario',
                    verificationCode: verificationCode,
                    companyName: company.name,
                },
            });
        } catch (error) {
            console.error(`Error enviando email a ${user.email}:`, error);
        }
    }

}
