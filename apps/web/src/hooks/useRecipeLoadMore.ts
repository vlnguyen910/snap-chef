import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from './useDebounce';
import { recipeService } from '@/services/recipeService';
import type { Recipe } from '@/types';

interface UseRecipeLoadMoreResult {
  recipes: Recipe[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  searchQuery: string;
  hasMore: boolean;
  setSearchQuery: (query: string) => void;
  loadMore: () => void;
  refetch: () => void;
}

const LIMIT = 16;

/**
 * Alternative hook using "Load More" pattern instead of pagination
 * This accumulates recipes as you load more pages
 */
export function useRecipeLoadMore(): UseRecipeLoadMoreResult {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchQuery, setSearchQueryState] = useState(
    searchParams.get('search') || ''
  );
  const [page, setPage] = useState(1);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Update URL with search query
  useEffect(() => {
    if (debouncedSearch) {
      setSearchParams({ search: debouncedSearch }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [debouncedSearch, setSearchParams]);

  // Reset when search changes
  useEffect(() => {
    setPage(1);
    setRecipes([]);
    setHasMore(true);
  }, [debouncedSearch]);

  // Fetch recipes
  const fetchRecipes = async (currentPage: number, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = await recipeService.getRecipesWithPagination({
        page: currentPage,
        limit: LIMIT,
        search: debouncedSearch,
      });

      if (append) {
        setRecipes((prev) => [...prev, ...data]);
      } else {
        setRecipes(data);
      }

      setHasMore(data.length === LIMIT);
    } catch (err: any) {
      console.error('Error fetching recipes:', err);
      setError(err?.response?.data?.message || 'Failed to load recipes');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Initial fetch and when search changes
  useEffect(() => {
    fetchRecipes(1, false);
  }, [debouncedSearch]);

  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);
  };

  const loadMore = () => {
    if (hasMore && !isLoadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRecipes(nextPage, true);
    }
  };

  const refetch = () => {
    setPage(1);
    fetchRecipes(1, false);
  };

  return {
    recipes,
    isLoading,
    isLoadingMore,
    error,
    searchQuery,
    hasMore,
    setSearchQuery,
    loadMore,
    refetch,
  };
}
