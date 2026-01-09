import { Injectable, Logger } from '@nestjs/common';
import * as SibApiV3Sdk from '@getbrevo/brevo';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import { join } from 'path';
import { User } from 'src/modules/users/entities/user.entity';
import { Company } from 'src/modules/companies/entities/company.entity';

@Injectable()
export class MailService {
  private apiInstance: SibApiV3Sdk.TransactionalEmailsApi;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    // Configura tu API KEY de Brevo aquí
    this.apiInstance.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY,
    );
  }

  // Función auxiliar para procesar tus plantillas .hbs actuales
  private async compileTemplate(
    templateName: string,
    context: any,
  ): Promise<string> {
    const templatePath = join(
      process.cwd(),
      'dist/modules/mail/templates',
      `${templateName}.hbs`,
    );
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(templateSource);
    return compiledTemplate(context);
  }

  async sendUserCredentials(
    user: User,
    company: Company,
    plainPassword?: string,
    pin?: string,
  ) {
    try {
      const htmlContent = await this.compileTemplate('user-credentials', {
        firstName: user.firstName ?? 'usuario',
        username: user.username ?? user.email,
        password: plainPassword,
        pin: pin,
        companyName: company.name,
      });

      await this.apiInstance.sendTransacEmail({
        subject: `Bienvenido a ${company.name}`,
        htmlContent: htmlContent,
        sender: { name: 'TicMeal', email: process.env.MAIL_USER },
        to: [{ email: user.email }],
      });

      this.logger.log(`Email de credenciales enviado a ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Error API Brevo (${user.email}):`,
        error.response?.body || error,
      );
    }
  }

  async sendVerificationCode(
    user: User,
    company: Company,
    verificationCode: string,
  ) {
    try {
      const htmlContent = await this.compileTemplate('email-verification', {
        firstName: user.firstName ?? 'usuario',
        verificationCode: verificationCode,
        companyName: company.name,
      });

      await this.apiInstance.sendTransacEmail({
        subject: `Código de verificación para ${company.name}`,
        htmlContent: htmlContent,
        sender: { name: 'TicMeal', email: process.env.MAIL_USER },
        to: [{ email: user.email }],
      });

      this.logger.log(`Email de verificación enviado a ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Error API Brevo (${user.email}):`,
        error.response?.body || error,
      );
    }
  }
}
