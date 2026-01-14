import { Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt.guard';

@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  //will be call after extract token from passport
  handleRequest(err: any, user: any) {
    if (err || !user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
