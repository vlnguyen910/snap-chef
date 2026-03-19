import { api } from "@/lib/axios";

export interface TopCategory {
  id: number;
  name: string;
  slug: string;
  recipe_count: number;
}

export interface TopUser {
  id: string;
  username: string;
  avatar_url: string | null;
  follower_count: number;
}

export const topDataService = {
  /**
   * Get top categories by recipe count
   */
  getTopCategories: async (limit: number = 5): Promise<TopCategory[]> => {
    const response = await api.get<TopCategory[]>("/categories/top", {
      params: { limit },
    });
    return response;
  },

  /**
   * Get top users by follower count
   */
  getTopUsers: async (limit: number = 5): Promise<TopUser[]> => {
    const response = await api.get<TopUser[]>("/users/top", {
      params: { limit },
    });
    return response;
  },
};
