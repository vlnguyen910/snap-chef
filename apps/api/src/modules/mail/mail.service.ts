import { Injectable } from '@nestjs/common';
import { User } from 'src/generated/prisma/client';
import { MailerService as MailService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
  constructor(
    private mailerService: MailService,
    private configService: ConfigService,
  ) {}

  async sendUserConfirmation(user: User, token: string) {
    const baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost:8080';
    const url = new URL('/api/auth/verify-email', baseUrl);
    url.searchParams.set('token', token);

    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Welcome to Cook Chef! Verify your Email',
      template: './email-verify', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        name: user.username,
        url: url.toString(),
      },
    });
  }

  async sendResetPassword(user: User, token: string) {
    const baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost:8080';
    const url = new URL('/api/auth/reset-password', baseUrl);
    url.searchParams.set('token', token);
    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Reset Your Password',
      template: './reset-password', // `.hbs` extension is appended automatically
      context: {
        name: user.username,
        url: url.toString(),
      },
    });
  }
}
