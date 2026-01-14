import { Injectable } from '@nestjs/common';
import { User } from 'src/generated/prisma/client';
import { MailerService as MailService } from '@nestjs-modules/mailer';

@Injectable()
export class MailerService {
  constructor(private mailerService: MailService) {}

  async sendUserConfirmation(user: User, token: string) {
    const url = `localhost:8080/api/auth/verify-email?id=${user.id}&token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Welcome to Cook Chef! Verify your Email',
      template: './email-verify', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        name: user.username,
        url,
      },
    });
  }
}
