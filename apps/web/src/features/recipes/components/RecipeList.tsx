import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import RecipeCard from './RecipeCard';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';
import { recipeService } from '@/services/recipeService';
import { useDebounce } from '@/hooks/useDebounce';
import type { Recipe } from '@/types';

interface RecipeListProps {
  userId?: string;
  // Nếu bạn muốn truyền status từ ngoài vào (như lỗi ở file RecipesPage.tsx lúc nãy)
  // thì bỏ comment dòng dưới:
  // status?: 'published' | 'pending'; 
}

export default function RecipeList({ userId }: RecipeListProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]); // Chỉ giữ 1 cái này
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // SỬA 1: Đổi tên thành searchTerm để khớp với bên dưới
  const [searchTerm, setSearchTerm] = useState(''); 
  
  // SỬA 2: Thêm state cho filterStatus
  const [filterStatus, setFilterStatus] = useState('all'); 

  const debouncedSearch = useDebounce(searchTerm, 500);

  const fetchRecipes = async () => {
    setIsLoading(true); // SỬA 3: Xóa chữ 'a' thừa
    setError(null);
    try {
      const data = await recipeService.getAllRecipes();
      setAllRecipes(data);
      setRecipes(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load recipes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [userId]);

  useEffect(() => {
    // Nếu chưa có data thì không cần lọc
    if (allRecipes.length === 0) return;

    let filtered = [...allRecipes];

    // Filter by search term
    if (debouncedSearch) {
      filtered = filtered.filter((recipe) =>
        recipe.title.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((recipe) => recipe.status === filterStatus);
    }

    // Filter by userId if provided
    if (userId) {
      filtered = filtered.filter((recipe) => recipe.userId === userId);
    }

    setRecipes(filtered);
  }, [debouncedSearch, filterStatus, allRecipes, userId]);

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={fetchRecipes} />;

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 w-full sm:w-auto"
        />
        
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'published' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('published')}
          >
            Published
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </Button>
        </div>
      </div>

      {/* Recipe grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {recipes.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          No recipes found
        </div>
      )}
    </div>
  );
}