import { api } from '@/lib/axios';
import type { Recipe } from '@/types';

export const recipeService = {
  /**
   * Create a new recipe
   */
  createRecipe: async (recipeData: {
    title: string;
    description?: string | null;
    cooking_time: number;
    servings: number; // ✅ Backend expects 'servings' (plural), not 'serving'
    thumbnail_url: string;
    ingredients: Array<{ name: string; quantity: number; unit: string }>;
    steps: Array<{ order_index: number; content: string; image_url?: string }>;
  }): Promise<Recipe> => {
    const response = await api.post<{ recipe: any }>('/recipes', recipeData);
    return normalizeRecipe(response.recipe);
  },

  /**
   * Get all recipes
   */
  getAllRecipes: async (): Promise<Recipe[]> => {
    const response = await api.get<any[]>('/recipes');
    const recipes = Array.isArray(response) ? response : [];
    return recipes.map(normalizeRecipe);
  },

  /**
   * Get recipe by ID
   */
  getRecipeById: async (id: string): Promise<Recipe> => {
    const response = await api.get<any>(`/recipes/${id}`);
    return normalizeRecipe(response);
  },

  /**
   * Update recipe
   */
  updateRecipe: async (id: string, updates: Partial<Recipe>): Promise<Recipe> => {
    const response = await api.patch<any>(`/recipes/${id}`, updates);
    return normalizeRecipe(response);
  },

  /**
   * Delete recipe
   */
  deleteRecipe: async (id: string): Promise<void> => {
    await api.delete(`/recipes/${id}`);
  },

  /**
   * Search recipes
   */
  searchRecipes: async (query: string): Promise<Recipe[]> => {
    const response = await api.get<any[]>('/recipes/search', {
      params: { q: query },
    });
    const recipes = Array.isArray(response) ? response : [];
    return recipes.map(normalizeRecipe);
  },
};

// Helper function to normalize recipe data
function normalizeRecipe(data: any): Recipe {
  // Calculate average rating from comments if available
  let averageRating = 0;
  let ratingsCount = 0;
  
  if (data.comments && Array.isArray(data.comments) && data.comments.length > 0) {
    const ratings = data.comments.filter((c: any) => c.rating != null).map((c: any) => c.rating);
    if (ratings.length > 0) {
      averageRating = ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length;
      ratingsCount = ratings.length;
    }
  }
  
  return {
    id: data.id?.toString() || '',
    title: data.title || '',
    description: data.description || '',
    imageUrl: data.thumbnail_url || data.image_url || '',
    userId: data.author_id || data.userId || '',
    authorId: data.author_id || data.authorId || '',
    // Map user data from backend
    user: data.user ? {
      id: data.user.id || data.author_id || '',
      name: data.user.username || 'Unknown',
      avatar: data.user.avatar_url,
    } : undefined,
    author: data.author || data.user || {
      id: data.author_id || '',
      username: data.user?.username || 'Unknown',
      avatar: data.user?.avatar_url,
    },
    cookingTime: data.cooking_time || data.cookingTime || 0,
    cookTime: data.cooking_time || data.cookTime || 0,
    prepTime: data.prep_time || data.prepTime || 0,
    servings: data.serving || data.servings || 1,
    status: (data.status || 'pending').toLowerCase(), // ✅ Chuẩn hóa về lowercase
    ingredients: data.ingredients || [],
    instructions: data.steps || data.instructions || [],
    rating: data.rating || averageRating,
    averageRating: data.average_rating || averageRating,
    ratingsCount: data.ratings_count || ratingsCount,
    reviewCount: data.reviewCount || data.comments_count || 0,
    favoriteCount: data.favoriteCount || data.likes_count || 0,
    forkCount: data.forkCount || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}