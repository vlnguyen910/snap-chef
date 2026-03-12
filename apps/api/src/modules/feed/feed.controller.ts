import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FeedService } from './feed.service';
import { OptionalJwtAuthGuard } from '../../common/guards';
import { GetUser } from '../../common/decorators';
import { TokenPayload } from '../../common/interfaces';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @ApiOperation({ summary: 'Get personalized recipe feed' })
  @ApiResponse({ status: 200, description: 'Return list of recipes for the feed' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Cursor for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items to return', example: 10 })
  @Get()
  @UseGuards(OptionalJwtAuthGuard) // Bắt buộc đăng nhập để xem Feed cá nhân
  async getFeed(
    @GetUser() user?: TokenPayload, // Lấy userId từ JWT Token
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parseLimit = limit ? parseInt(limit, 10) : 10;

    // Gọi Service xử lý logic
    const result = await this.feedService.getUserFeed(
      user?.sub, // sub thường lưu ID của user trong token payload
      cursor,
      parseLimit,
    );

    return result;
  }
}

