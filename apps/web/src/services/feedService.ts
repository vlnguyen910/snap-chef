import { api } from "@/lib/axios";
import type { RecipeFeedItem } from "@/features/feed";

interface FeedRecipeApiItem {
  id: string;
  title: string;
  cooking_time: number;
  thumbnail_url: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url: string;
  };
  count?: {
    like?: number;
    comment?: number;
    averageRating?: number;
  };
}

interface FeedApiResponse {
  data?: FeedRecipeApiItem[];
  nextCursor?: string | null;
}

export interface HomeFeedResponse {
  recipes: RecipeFeedItem[];
  nextCursor: string | null;
}

export const feedService = {
  getFeed: async (params?: {
    cursor?: string;
    limit?: number;
  }): Promise<HomeFeedResponse> => {
    const response = await api.get<FeedApiResponse>("/feed", {
      params: {
        cursor: params?.cursor,
        limit: params?.limit,
      },
    });

    const items = Array.isArray(response?.data) ? response.data : [];

    return {
      recipes: items.map(normalizeFeedRecipe),
      nextCursor: response?.nextCursor ?? null,
    };
  },
};

function normalizeFeedRecipe(data: FeedRecipeApiItem): RecipeFeedItem {
  const likesCount = data.count?.like ?? 0;
  const commentsCount = data.count?.comment ?? 0;
  const averageRating = data.count?.averageRating ?? 0;

  return {
    id: data.id,
    title: data.title || "Untitled Recipe",
    image: data.thumbnail_url || "https://via.placeholder.com/600x400",
    createdAt: data.created_at,
    cookTime: formatCookTime(data.cooking_time),
    rating: Number(averageRating.toFixed(1)),
    ratingCount: formatCount(commentsCount),
    likesCount,
    commentsCount,
    difficulty: getDifficulty(data.cooking_time),
    author: data.user?.username || "Unknown Chef",
    authorAvatar:
      data.user?.avatar_url ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        data.user?.username || data.id,
      )}`,
  };
}

function getDifficulty(cookingTime: number): RecipeFeedItem["difficulty"] {
  if (cookingTime <= 20) return "Beginner";
  if (cookingTime <= 45) return "Intermediate";
  return "Pro";
}

function formatCookTime(minutes: number): string {
  if (!minutes || minutes <= 0) return "N/A";
  if (minutes < 60) return `${minutes} mins`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function formatCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return `${value}`;
}
