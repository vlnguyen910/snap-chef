import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { googleConfiguration } from '../config/google.config';
import type { ConfigType } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(googleConfiguration.KEY)
    private readonly googleConfig: ConfigType<typeof googleConfiguration>,
  ) {
    super({
      clientID: googleConfig.clientID!,
      clientSecret: googleConfig.clientSerect!,
      callbackURL: googleConfig.callbackURL!,
      scope: googleConfig.scope!,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;

    if (!emails?.[0]?.value) {
      return done(new UnauthorizedException(), false);
    }

    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      refreshToken,
    };
    done(null, user);
  }
}
