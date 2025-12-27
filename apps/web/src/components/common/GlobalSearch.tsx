import { useState } from 'react';
import { Search, Loader2, X, User as UserIcon, ChefHat } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import type { Recipe } from '@/types';

type SearchMode = 'users' | 'recipes';

interface SearchUser {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  defaultMode?: SearchMode;
}

export default function GlobalSearch({ 
  className = '',
  placeholder,
  defaultMode = 'recipes'
}: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>(defaultMode);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const navigate = useNavigate();

  // Search recipes
  const { data: recipes = [], isLoading: isLoadingRecipes } = useQuery<Recipe[]>({
    queryKey: ['search-recipes', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      const response = await api.get<any[]>('/recipes', {
        params: { search: debouncedQuery, page: 1, limit: 10 }
      });
      return Array.isArray(response) ? response : [];
    },
    enabled: searchMode === 'recipes' && debouncedQuery.length > 0,
  });

  // Search users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<SearchUser[]>({
    queryKey: ['search-users', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      const response = await api.get<SearchUser[]>('/users', {
        params: { search: debouncedQuery, page: 1, limit: 10 }
      });
      return Array.isArray(response) ? response : [];
    },
    enabled: searchMode === 'users' && debouncedQuery.length > 0,
  });

  const isLoading = searchMode === 'recipes' ? isLoadingRecipes : isLoadingUsers;
  const hasResults = searchMode === 'recipes' ? recipes.length > 0 : users.length > 0;

  const handleClear = () => {
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleRecipeClick = (recipeId: string) => {
    navigate(`/recipes/${recipeId}`);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleUserClick = (userId: string) => {
    navigate(`/users/${userId}/profile`);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    setSearchQuery('');
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    return searchMode === 'recipes' ? 'Search recipes...' : 'Search users...';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input with Mode Selector */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 border-l pl-2">
            <button
              onClick={() => handleModeChange('recipes')}
              className={`p-1 rounded transition-colors ${
                searchMode === 'recipes' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Search Recipes"
            >
              <ChefHat className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleModeChange('users')}
              className={`p-1 rounded transition-colors ${
                searchMode === 'users' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Search Users"
            >
              <UserIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={getPlaceholder()}
          className="w-full pl-32 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        />
        
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && searchQuery && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Results */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
                <span className="ml-2 text-gray-600">Searching...</span>
              </div>
            ) : !hasResults ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No {searchMode} found for "{searchQuery}"
              </div>
            ) : searchMode === 'recipes' ? (
              <div className="py-2">
                {recipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => handleRecipeClick(recipe.id)}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-all cursor-pointer border-b border-gray-100 last:border-0 group"
                  >
                    <div className="relative">
                      <img 
                        src={recipe.imageUrl || 'https://via.placeholder.com/150'} 
                        alt={recipe.title}
                        className="h-14 w-14 rounded-xl object-cover ring-2 ring-gray-100 group-hover:ring-orange-300 transition-all"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                        {recipe.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
                        <span className="flex items-center gap-1"><span className="text-orange-500">⏱️</span> {recipe.cookingTime}m</span>
                        <span className="flex items-center gap-1"><span className="text-blue-500">🍽️</span> {recipe.servings}</span>
                        {recipe.reviewCount > 0 && (
                          <span className="flex items-center gap-1"><span className="text-red-500">❤️</span> {recipe.reviewCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all cursor-pointer border-b border-gray-100 last:border-0 group"
                  >
                    <div className="relative">
                      <img 
                        src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                        alt={user.username}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-300 transition-all"
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {user.username}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-gray-400 truncate mt-1 italic">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
