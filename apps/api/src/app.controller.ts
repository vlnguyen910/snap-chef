import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('health')
export class AppController {
  @Get()
  check() {
    return 'I am alive!';
  }
}
