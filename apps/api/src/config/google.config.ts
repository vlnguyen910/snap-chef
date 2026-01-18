import { registerAs } from '@nestjs/config';

export const googleConfiguration = registerAs('google', () => ({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSerect: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOOGLE_CALLBACK_URL,
  scope: ['email', 'profile'],
}));
