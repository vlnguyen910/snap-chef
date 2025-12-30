import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from './useDebounce';
import { recipeService } from '@/services/recipeService';
import type { Recipe } from '@/types';

interface UseRecipeSearchResult {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  page: number;
  searchQuery: string;
  hasMore: boolean;
  setSearchQuery: (query: string) => void;
  nextPage: () => void;
  previousPage: () => void;
  refetch: () => void;
}

const LIMIT = 16;

export function useRecipeSearch(): UseRecipeSearchResult {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL params
  const [searchQuery, setSearchQueryState] = useState(
    searchParams.get('search') || ''
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Debounce search query to avoid spamming API
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Update URL when search or page changes
  useEffect(() => {
    const params: Record<string, string> = {};
    
    if (debouncedSearch) {
      params.search = debouncedSearch;
    }
    
    if (page > 1) {
      params.page = page.toString();
    }
    
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, page, setSearchParams]);

  // Reset page to 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Fetch recipes
  const fetchRecipes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await recipeService.getRecipesWithPagination({
        page,
        limit: LIMIT,
        search: debouncedSearch,
      });

      setRecipes(data);
      
      // If we received fewer items than the limit, we've reached the last page
      setHasMore(data.length === LIMIT);
    } catch (err: any) {
      console.error('Error fetching recipes:', err);
      setError(err?.response?.data?.message || 'Failed to load recipes');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchRecipes();
  }, [page, debouncedSearch]);

  // Set search query and update state
  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);
  };

  // Pagination controls
  const nextPage = () => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const previousPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  return {
    recipes,
    isLoading,
    error,
    page,
    searchQuery,
    hasMore,
    setSearchQuery,
    nextPage,
    previousPage,
    refetch: fetchRecipes,
  };
}
