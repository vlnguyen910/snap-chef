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

  private getFrontendBaseUrl(): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('WEB_URL') ||
      this.configService.get<string>('CLIENT_URL');

    if (frontendUrl) {
      return frontendUrl;
    }

    const corsOrigins = this.configService.get<string>('CORS_ORIGINS');
    if (corsOrigins) {
      const firstOrigin = corsOrigins.split(',')[0]?.trim();
      if (firstOrigin) return firstOrigin;
    }

    return 'http://localhost:5173';
  }

  async sendUserConfirmation(user: User, token: string) {
    const url = new URL('/verify-email', this.getFrontendBaseUrl());
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
    const url = new URL('/auth/reset-password', this.getFrontendBaseUrl());
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
