import { Button } from '@/components/ui/button';
import RecipeCard from './RecipeCard';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';
import SearchInput from '@/components/common/SearchInput';
import { useRecipeLoadMore } from '@/hooks/useRecipeLoadMore';
import { Search, Loader2 } from 'lucide-react';

/**
 * Alternative RecipeList component using "Load More" pattern
 * This version accumulates recipes as you click "Load More"
 * instead of replacing them on pagination
 */
export default function RecipeListLoadMore() {
  const {
    recipes,
    isLoading,
    isLoadingMore,
    error,
    searchQuery,
    hasMore,
    setSearchQuery,
    loadMore,
    refetch,
  } = useRecipeLoadMore();

  if (isLoading) {
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
              Showing {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {/* Empty State */}
      {recipes.length === 0 && (
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

      {/* Load More Button */}
      {hasMore && recipes.length > 0 && (
        <div className="flex justify-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={loadMore}
            disabled={isLoadingMore}
            size="lg"
            variant="outline"
            className="min-w-[200px]"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Recipes'
            )}
          </Button>
        </div>
      )}

      {/* End of Results Message */}
      {!hasMore && recipes.length > 0 && (
        <div className="text-center py-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You've reached the end of the recipes list
          </p>
        </div>
      )}
    </div>
  );
}
