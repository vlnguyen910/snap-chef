// ============================================
// EXAMPLE USAGE: Recipe Search & Pagination
// ============================================
import { useState, useEffect } from 'react';
import RecipeList from '@/features/recipes/components/RecipeList';
import RecipeListLoadMore from '@/features/recipes/components/RecipeListLoadMore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useParams, useSearchParams } from 'react-router-dom';
import { useRecipeSearch } from '@/hooks/useRecipeSearch';
import { useRecipeLoadMore } from '@/hooks/useRecipeLoadMore';
import RecipeCard from '@/features/recipes/components/RecipeCard';
import { Button } from '@/components/ui/button';
import SearchInput from '@/components/common/SearchInput';

// =====================================
// Example 1: Basic Recipe List Page with Pagination
// =====================================
export function Example1_RecipesPage() {
  useDocumentTitle('All Recipes');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          All Recipes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Explore our collection of delicious recipes
        </p>
      </div>

      {/* This component includes search, pagination, and recipe grid */}
      <RecipeList />
    </div>
  );
}

// =====================================
// Example 2: Recipe List with Load More
// =====================================
export function Example2_RecipesPageLoadMore() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Discover Recipes</h1>
      
      {/* This uses "Load More" pattern instead of pagination */}
      <RecipeListLoadMore />
    </div>
  );
}

// =====================================
// Example 3: User-Specific Recipe List
// =====================================
export function Example3_UserRecipesPage() {
  const { userId } = useParams<{ userId: string }>();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Recipes</h1>
      
      {/* Pass userId to filter recipes by specific user */}
      <RecipeList userId={userId} />
    </div>
  );
}

// =====================================
// Example 4: Custom Implementation Using the Hook
// =====================================
export function Example4_CustomRecipeList() {
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
  } = useRecipeSearch();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Custom Search UI */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search recipes..."
        className="border rounded px-4 py-2"
      />

      {/* Custom Grid Layout */}
      <div className="grid grid-cols-3 gap-4">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {/* Custom Pagination UI */}
      <div className="flex gap-4 justify-center">
        <Button onClick={previousPage} disabled={page === 1}>
          Previous
        </Button>
        <span>Page {page}</span>
        <Button onClick={nextPage} disabled={!hasMore}>
          Next
        </Button>
      </div>
    </div>
  );
}

// =====================================
// Example 5: Using Load More Hook Directly
// =====================================
export function Example5_InfiniteScrollRecipes() {
  const {
    recipes,
    isLoadingMore,
    searchQuery,
    hasMore,
    setSearchQuery,
    loadMore,
  } = useRecipeLoadMore();

  return (
    <div className="space-y-6">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search recipes..."
      />

      <div className="grid grid-cols-4 gap-6">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {hasMore && (
        <Button onClick={loadMore} disabled={isLoadingMore}>
          {isLoadingMore ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  );
}

// =====================================
// Example 6: With Additional Filters
// =====================================
export function Example6_RecipesWithFilters() {
  const { recipes, searchQuery, setSearchQuery } = useRecipeSearch();
  const [category, setCategory] = useState('');
  
  // Client-side filtering by category (Note: requires Recipe type to have category field)
  const filteredRecipes = category
    ? recipes.filter((r) => (r as any).category === category)
    : recipes;

  return (
    <div className="space-y-6">
      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search recipes..."
      />

      {/* Category Filter */}
      <div className="flex gap-2">
        <Button
          variant={category === '' ? 'default' : 'outline'}
          onClick={() => setCategory('')}
        >
          All
        </Button>
        <Button
          variant={category === 'breakfast' ? 'default' : 'outline'}
          onClick={() => setCategory('breakfast')}
        >
          Breakfast
        </Button>
        <Button
          variant={category === 'lunch' ? 'default' : 'outline'}
          onClick={() => setCategory('lunch')}
        >
          Lunch
        </Button>
        <Button
          variant={category === 'dinner' ? 'default' : 'outline'}
          onClick={() => setCategory('dinner')}
        >
          Dinner
        </Button>
      </div>

      {/* Results */}
      <div className="grid grid-cols-4 gap-6">
        {filteredRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}

// =====================================
// Example 7: Reusable SearchInput Component
// =====================================
export function Example7_SearchExample() {
  const [query, setQuery] = useState('');

  return (
    <div className="space-y-4">
      {/* Basic usage */}
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search..."
      />

      {/* With custom className */}
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search recipes..."
        className="max-w-lg"
        showClearButton={true}
      />

      <p>You searched for: {query}</p>
    </div>
  );
}

// =====================================
// Example 8: Testing Search Behavior
// =====================================
export function Example8_SearchBehaviorDemo() {
  const { searchQuery, setSearchQuery, page, recipes } = useRecipeSearch();

  useEffect(() => {
    console.log('Search changed to:', searchQuery);
    console.log('Page reset to:', page);
    console.log('Results:', recipes.length);
  }, [searchQuery, page, recipes]);

  return (
    <div className="p-8">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Type to see debouncing in action..."
        className="border rounded px-4 py-2 w-full"
      />

      <div className="mt-4 space-y-2">
        <p><strong>Current Search:</strong> {searchQuery || 'None'}</p>
        <p><strong>Current Page:</strong> {page}</p>
        <p><strong>Results:</strong> {recipes.length}</p>
        <p className="text-sm text-gray-600">
          💡 Notice how the page automatically resets to 1 when you search!
        </p>
        <p className="text-sm text-gray-600">
          💡 API calls are debounced - wait 500ms after typing to see the call
        </p>
      </div>
    </div>
  );
}

// =====================================
// Example 9: URL State Inspection
// =====================================
export function Example9_URLStateDemo() {
  const { searchQuery, setSearchQuery, nextPage } = useRecipeSearch();
  const [searchParams] = useSearchParams();

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">URL State Demo</h2>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..."
        className="border rounded px-4 py-2 w-full"
      />

      <button onClick={nextPage} className="px-4 py-2 bg-blue-500 text-white rounded">
        Next Page
      </button>

      <div className="p-4 bg-gray-100 rounded">
        <p><strong>Current URL Search Params:</strong></p>
        <pre className="mt-2">{JSON.stringify(Object.fromEntries(searchParams), null, 2)}</pre>
      </div>

      <div className="p-4 bg-blue-50 rounded">
        <p className="text-sm">
          💡 Try searching and navigating pages. Notice how the URL updates!
          <br />
          💡 Copy the URL and paste it in a new tab - the state persists!
        </p>
      </div>
    </div>
  );
}
