import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/db/prisma.service';
import { RecipeStatus } from 'src/generated/prisma/enums';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Truy xuất Newsfeed cá nhân hóa cho User dựa trên những người họ đang theo dõi (Pull Model)
   * Sử dụng Cursor-based Pagination để cuộn vô hạn mượt mà.
   *
   * @param userId ID của user đang gửi request
   * @param cursor ID của bài viết cuối cùng ở trang trước (dùng làm mốc)
   * @param limit Số lượng bài viết mỗi lần lấy
   * @returns Object chứa mảng data và nextCursor
   */

  async getUserFeed(userId?: string, cursor?: string, limit: number = 10) {
    if (!userId) return this.getTrendingRecipes(limit);

    const feed = await this.prisma.recipe.findMany({
      take: limit + 1,
      skip: cursor ? 1 : 0, // nếu có cursor thì là không recipe để lấy tiếp nên bỏ qua cái lấy thừa của limit + 1
      ...(cursor ? { cursor: { id: cursor } } : {}),
      where: {
        status: RecipeStatus.PUBLISHED,
        deleted_at: null,
        user: {
          followedBy: {
            some: {
              follower_id: userId,
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (feed.length > limit) {
      const nextItem = feed.pop(); // lấy recipe bị thừa ra
      if (nextItem) nextCursor = nextItem.id;
    }

    if (feed.length === 0 && !cursor) return this.getTrendingRecipes(limit);

    return {
      data: feed,
      nextCursor,
    };
  }

  /**
   * Fallback: Lấy danh sách bài viết thịnh hành/mới nhất toàn hệ thống.
   * Dùng khi user chưa theo dõi ai, hoặc danh sách feed trả về rỗng.
   *
   * @param limit Số lượng bài viết
   */
  async getTrendingRecipes(limit: number = 10) {
    // Boilerplate: Lấy các recipes `PUBLISHED`
    // TODO: Viết logic query cơ bản lấy bài mới nhất/nhiều like nhất
    const recipes = await this.prisma.recipe.findMany({
      take: limit,
      where: {
        status: RecipeStatus.PUBLISHED,
        deleted_at: null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        likes: {
          _count: 'desc',
        },
        comments: {
          _count: 'desc',
        },
      },
    });

    return {
      data: recipes,
      nextCursor: null,
    };
  }
}
