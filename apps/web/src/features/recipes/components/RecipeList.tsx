import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RecipeCard from './RecipeCard';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';
import { api } from '@/lib/axios';
import { useDebounce } from '@/hooks/useDebounce';
import type { Recipe, PaginatedResponse } from '@/types';

interface RecipeListProps {
  userId?: string;
  status?: 'pending' | 'approved' | 'rejected';
  featured?: boolean;
}

export default function RecipeList({ userId, status, featured }: RecipeListProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    cuisine: '',
    difficulty: '',
    maxTime: '',
  });

  const debouncedSearch = useDebounce(searchQuery, 500);

  const fetchRecipes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (status) params.append('status', status);
      if (featured) params.append('featured', 'true');
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (filters.cuisine) params.append('cuisine', filters.cuisine);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.maxTime) params.append('maxTime', filters.maxTime);

      const response = await api.get<PaginatedResponse<Recipe>>(`/recipes?${params}`);
      setRecipes(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load recipes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [debouncedSearch, userId, status, featured, filters]);

  const clearFilters = () => {
    setFilters({ cuisine: '', difficulty: '', maxTime: '' });
    setSearchQuery('');
  };

  if (isLoading && recipes.length === 0) {
    return <Loading message="Loading recipes..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchRecipes} />;
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes by name, ingredients..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal size={20} />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuisine
              </label>
              <select
                value={filters.cuisine}
                onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Cuisines</option>
                <option value="italian">Italian</option>
                <option value="chinese">Chinese</option>
                <option value="indian">Indian</option>
                <option value="mexican">Mexican</option>
                <option value="japanese">Japanese</option>
                <option value="thai">Thai</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Time (minutes)
              </label>
              <input
                type="number"
                value={filters.maxTime}
                onChange={(e) => setFilters({ ...filters, maxTime: e.target.value })}
                placeholder="e.g. 30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-3 flex justify-end">
              <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                <X size={16} />
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'} found
        </p>
      </div>

      {/* Recipe Grid */}
      {recipes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No recipes found</p>
          {(searchQuery || filters.cuisine || filters.difficulty || filters.maxTime) && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
