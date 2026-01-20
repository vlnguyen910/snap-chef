import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { googleConfiguration } from '../../../config';
import type { ConfigType } from '@nestjs/config';

interface GoogleProfile {
  id: string;
  name: {
    givenName: string;
    familyName: string;
  };
  emails: { value: string }[];
  photos: { value: string }[];
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(googleConfiguration.KEY)
    private readonly googleConfig: ConfigType<typeof googleConfiguration>,
  ) {
    super({
      clientID: googleConfig.clientID!,
      clientSecret: googleConfig.clientSecret!,
      callbackURL: googleConfig.callbackURL!,
      scope: googleConfig.scope,
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): any {
    const { name, emails, photos } = profile;

    if (!emails?.[0]?.value) {
      return done(new UnauthorizedException(), false);
    }

    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos?.[0]?.value,
      provider_id: profile.id,
    };
    return done(null, user);
  }
}
