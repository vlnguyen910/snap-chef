import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { OauthAccount, OAuthProvider } from 'src/generated/prisma/client';
import { CreateOauthAccountDto } from './dto/create-oauth-account.dto';

@Injectable()
export class OauthService {
  constructor(private prisma: PrismaService) {}

  async createOauthAccount(dto: CreateOauthAccountDto): Promise<OauthAccount> {
    const oauthAccount = await this.prisma.oauthAccount.create({
      data: {
        user_id: dto.user_id,
        provider: dto.provider,
        provider_id: dto.provider_id,
      },
    });

    return oauthAccount;
  }

  async findOauthAccount(
    user_id: string,
    provider: OAuthProvider,
  ): Promise<OauthAccount | null> {
    return await this.prisma.oauthAccount.findFirst({
      where: {
        user_id,
        provider,
      },
    });
  }
}
