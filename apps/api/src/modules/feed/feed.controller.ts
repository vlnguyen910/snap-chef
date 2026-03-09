import { Controller, Get, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { FeedService } from './feed.service';
import { AuthGuard } from '../../common/guards';
import { GetUser } from '../../common/decorators';
import { TokenPayload } from '../../common/interfaces';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @UseGuards(AuthGuard) // Bắt buộc đăng nhập để xem Feed cá nhân
  async getFeed(
    @GetUser() user: TokenPayload, // Lấy userId từ JWT Token
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parseLimit = limit ? parseInt(limit, 10) : 10;
    
    // Gọi Service xử lý logic
    const result = await this.feedService.getUserFeed(
      user.sub, // sub thường lưu ID của user trong token payload
      cursor,
      parseLimit,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy newsfeed thành công',
      data: result.data,
      meta: {
        nextCursor: result.nextCursor,
      }
    };
  }
}
