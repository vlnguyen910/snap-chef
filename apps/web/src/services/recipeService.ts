import { api } from '@/lib/axios';
import type { Recipe } from '@/types';

export const recipeService = {
  /**
   * Create a new recipe
   */
  createRecipe: async (recipeData: {
    title: string;
    description: string;
    cooking_time: number;
    serving: number;
    thumbnail_url: string;
    is_private: boolean;
    ingredients: Array<{ name: string; amount: string; unit: string }>;
    steps: Array<{ order_index: number; content: string; image_url: string }>;
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
  return {
    id: data.id?.toString() || '',
    title: data.title || '',
    description: data.description || '',
    imageUrl: data.thumbnail_url || data.image_url || '',
    userId: data.author_id || data.userId || '',
    authorId: data.author_id || data.authorId || '',
    author: data.author || {
      id: data.author_id || '',
      username: 'Unknown',
      avatar: undefined,
    },
    cookingTime: data.cooking_time || data.cookingTime || 0,
    cookTime: data.cooking_time || data.cookTime || 0,
    prepTime: data.prep_time || data.prepTime || 0,
    servings: data.serving || data.servings || 1,
    status: data.status || 'pending',
    ingredients: data.ingredients || [],
    instructions: data.steps || data.instructions || [],
    rating: data.rating || 0,
    reviewCount: data.reviewCount || 0,
    favoriteCount: data.favoriteCount || 0,
    forkCount: data.forkCount || 0,
  };
}