import { Module } from "@nestjs/common";
import { MailerModule } from '@nestjs-modules/mailer';
import { MailerService } from "@nestjs-modules/mailer";

@Module({
    imports: [
        MailerModule.forRoot({
            transport: {
                host: process.env.MAIL_HOST || 'smtp.gmail.com',
                port: Number(process.env.MAIL_PORT) || 587,
                secure: false,
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                },
            },
            defaults: {
                from:  '"TicMeal" <no-reply@ticmeal.com>',
            },
        }),
    ],
    providers: [MailerService],
    exports: [MailerService],
})
export class MailModule {}