import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/db/prisma.service';
import { RecipeStatus } from 'src/generated/prisma/enums';

type FeedRecipeRecord = {
  id: string;
  title: string;
  cooking_time: number;
  thumbnail_url: string;
  created_at: Date;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
};

type FeedRecipeResponseItem = {
  id: string;
  title: string;
  cooking_time: number;
  thumbnail_url: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    avatar_url: string;
  };
  count: {
    like: number;
    comment: number;
    averageRating: number;
  };
};

type FeedResponse = {
  data: FeedRecipeResponseItem[];
  nextCursor: string | null;
};

const TRENDING_CURSOR_PREFIX = 'trending:';

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

  async getUserFeed(
    userId?: string,
    cursor?: string,
    limit: number = 10,
  ): Promise<FeedResponse> {
    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(limit, 1), 30)
      : 10;

    if (!userId) return this.getTrendingRecipes(safeLimit, cursor);

    const parsedCursor = this.parseCursor(cursor);
    if (parsedCursor.isTrending) {
      return this.getTrendingRecipes(safeLimit, cursor, userId);
    }

    const feed = await this.prisma.recipe.findMany({
      take: safeLimit + 1,
      skip: parsedCursor.cursorId ? 1 : 0, // nếu có cursor thì là không recipe để lấy tiếp nên bỏ qua cái lấy thừa của limit + 1
      ...(parsedCursor.cursorId ? { cursor: { id: parsedCursor.cursorId } } : {}),
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
      select: {
        id: true,
        title: true,
        cooking_time: true,
        thumbnail_url: true,
        created_at: true,
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
    if (feed.length > safeLimit) {
      const nextItem = feed.pop(); // lấy recipe bị thừa ra
      if (nextItem) nextCursor = nextItem.id;
    }

    if (feed.length === 0) {
      return this.getTrendingRecipes(safeLimit, undefined, userId);
    }

    const data = await this.toFeedResponseItems(feed as FeedRecipeRecord[]);

    if (!nextCursor) {
      const hasTrendingRecipes = await this.prisma.recipe.findFirst({
        where: this.getTrendingWhere(userId),
        select: {
          id: true,
        },
      });

      if (hasTrendingRecipes) {
        nextCursor = TRENDING_CURSOR_PREFIX;
      }
    }

    return {
      data,
      nextCursor,
    };
  }

  /**
   * Fallback: Lấy danh sách bài viết thịnh hành/mới nhất toàn hệ thống.
   * Dùng khi user chưa theo dõi ai, hoặc danh sách feed trả về rỗng.
   *
   * @param limit Số lượng bài viết
   */
  async getTrendingRecipes(
    limit: number = 10,
    cursor?: string,
    excludeFollowedByUserId?: string,
  ): Promise<FeedResponse> {
    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(limit, 1), 30)
      : 10;

    const parsedCursor = this.parseCursor(cursor);

    const recipes = await this.prisma.recipe.findMany({
      take: safeLimit + 1,
      skip: parsedCursor.cursorId ? 1 : 0,
      ...(parsedCursor.cursorId ? { cursor: { id: parsedCursor.cursorId } } : {}),
      where: this.getTrendingWhere(excludeFollowedByUserId),
      select: {
        id: true,
        title: true,
        cooking_time: true,
        thumbnail_url: true,
        created_at: true,
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
      orderBy: [
        {
          likes: {
            _count: 'desc',
          },
        },
        {
          comments: {
            _count: 'desc',
          },
        },
        {
          id: 'desc',
        },
      ],
    });

    let nextCursor: string | null = null;
    if (recipes.length > safeLimit) {
      const nextItem = recipes.pop();
      if (nextItem) nextCursor = this.formatTrendingCursor(nextItem.id);
    }

    const data = await this.toFeedResponseItems(recipes as FeedRecipeRecord[]);

    return {
      data,
      nextCursor,
    };
  }

  private async toFeedResponseItems(
    recipes: FeedRecipeRecord[],
  ): Promise<FeedRecipeResponseItem[]> {
    if (recipes.length === 0) return [];

    const recipeIds = recipes.map((recipe) => recipe.id);

    const ratingGroups = await this.prisma.comment.groupBy({
      by: ['recipe_id'],
      where: {
        recipe_id: {
          in: recipeIds,
        },
      },
      _avg: {
        rating: true,
      },
    });

    const avgRatingMap = new Map<string, number>();
    for (const group of ratingGroups) {
      const average = group._avg.rating ?? 0;
      avgRatingMap.set(group.recipe_id, Number(average.toFixed(1)));
    }

    return recipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      cooking_time: recipe.cooking_time,
      thumbnail_url: recipe.thumbnail_url,
      created_at: recipe.created_at.toISOString(),
      user: {
        id: recipe.user.id,
        username: recipe.user.username,
        avatar_url: recipe.user.avatar_url ?? '',
      },
      count: {
        like: recipe._count.likes,
        comment: recipe._count.comments,
        averageRating: avgRatingMap.get(recipe.id) ?? 0,
      },
    }));
  }

  private parseCursor(cursor?: string): {
    isTrending: boolean;
    cursorId?: string;
  } {
    if (!cursor) {
      return { isTrending: false };
    }

    if (cursor.startsWith(TRENDING_CURSOR_PREFIX)) {
      const cursorId = cursor.slice(TRENDING_CURSOR_PREFIX.length);
      return {
        isTrending: true,
        cursorId: cursorId || undefined,
      };
    }

    return {
      isTrending: false,
      cursorId: cursor,
    };
  }

  private formatTrendingCursor(id: string): string {
    return `${TRENDING_CURSOR_PREFIX}${id}`;
  }

  private getTrendingWhere(excludeFollowedByUserId?: string) {
    if (!excludeFollowedByUserId) {
      return {
        status: RecipeStatus.PUBLISHED,
        deleted_at: null,
      };
    }

    return {
      status: RecipeStatus.PUBLISHED,
      deleted_at: null,
      user: {
        followedBy: {
          none: {
            follower_id: excludeFollowedByUserId,
          },
        },
      },
    };
  }
}
