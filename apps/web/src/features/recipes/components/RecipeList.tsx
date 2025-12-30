import { Button } from '@/components/ui/button';
import RecipeCard from './RecipeCard';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';
import SearchInput from '@/components/common/SearchInput';
import { useRecipeSearch } from '@/hooks/useRecipeSearch';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface RecipeListProps {
  userId?: string;
}

export default function RecipeList({ userId }: RecipeListProps) {
  const {
    recipes,
    isLoading,
    error,
    page,
    searchQuery,
    hasMore,
    setSearchQuery,
    nextPage,
    previousPage,
    refetch,
  } = useRecipeSearch();

  // Filter by userId if provided (for user-specific recipe lists)
  const displayedRecipes = userId
    ? recipes.filter((recipe) => recipe.userId === userId)
    : recipes;

  if (isLoading && page === 1) {
    return <Loading />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search recipes..."
          className="flex-1 max-w-md"
        />

        {/* Results Info */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {searchQuery && (
            <span>
              Found {displayedRecipes.length} recipe{displayedRecipes.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Recipe Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
            {displayedRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>

          {/* Empty State */}
          {displayedRecipes.length === 0 && (
            <div className="py-16 text-center">
              <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No recipes found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery
                  ? `Try adjusting your search term "${searchQuery}"`
                  : 'No recipes available at the moment'}
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {displayedRecipes.length > 0 && (
            <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={previousPage}
                disabled={page === 1}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Page {page}
              </span>

              <Button
                onClick={nextPage}
                disabled={!hasMore}
                variant="outline"
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}