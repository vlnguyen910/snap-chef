import { useState } from 'react';
import { api } from '@/lib/axios';
import { useStore } from '@/lib/store';
import type { Recipe, Rating } from '@/types';

export function useRecipeActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useStore();

  // Track favorited recipes locally
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  const toggleFavorite = async (recipeId: string): Promise<boolean> => {
    if (!user) {
      setError('Please login to favorite recipes');
      return false;
    }

    setIsLoading(true);
    setError(null);
    try {
      const isFavorited = favoritedIds.has(recipeId);
      
      if (isFavorited) {
        await api.delete(`/recipes/${recipeId}/favorite`);
        setFavoritedIds(prev => {
          const next = new Set(prev);
          next.delete(recipeId);
          return next;
        });
      } else {
        await api.post(`/recipes/${recipeId}/favorite`);
        setFavoritedIds(prev => new Set(prev).add(recipeId));
      }
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update favorite');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const forkRecipe = async (recipeId: string, modifications?: Partial<Recipe>): Promise<Recipe | null> => {
    if (!user) {
      setError('Please login to fork recipes');
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<{ recipe: Recipe }>(`/recipes/${recipeId}/fork`, modifications);
      return response.data.recipe;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fork recipe');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const rateRecipe = async (recipeId: string, rating: number, comment?: string): Promise<boolean> => {
    if (!user) {
      setError('Please login to rate recipes');
      return false;
    }

    if (rating < 1 || rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.post<{ rating: Rating }>(`/recipes/${recipeId}/rate`, { rating, comment });
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to rate recipe');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecipe = async (recipeId: string): Promise<boolean> => {
    if (!user) {
      setError('Please login to delete recipes');
      return false;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/recipes/${recipeId}`);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete recipe');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const isFavorited = (recipeId: string): boolean => {
    return favoritedIds.has(recipeId);
  };

  return {
    toggleFavorite,
    forkRecipe,
    rateRecipe,
    deleteRecipe,
    isFavorited,
    isLoading,
    error,
  };
}
