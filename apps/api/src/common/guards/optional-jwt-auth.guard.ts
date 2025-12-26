import { Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt.guard';

export class OptionalJwtAuthGuard extends JwtAuthGuard {
  //will be call after extract token from passport
  handleRequest(err, user, info) {
    if (err || !user) {
      return null;
    }

    return user;
  }
}
