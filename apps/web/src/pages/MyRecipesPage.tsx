import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Loader2, Edit, Trash2 } from 'lucide-react';
import { api } from '@/lib/axios';
import { useStore } from '@/lib/store';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface Recipe {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  cooking_time: number;
  servings: number;
  status: string;
}

export default function MyRecipesPage() {
  const navigate = useNavigate();
  const currentUser = useStore((state) => state.user);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 9; // 9 recipes per page (3x3 grid)

  useDocumentTitle('My Recipes');

  useEffect(() => {
    fetchMyRecipes(1);
  }, []);

  const fetchMyRecipes = async (pageNum: number) => {
    if (!currentUser?.id) return;

    try {
      const isLoadingMore = pageNum > 1;
      if (isLoadingMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const data = await api.get<Recipe[]>(
        `/recipes/user/${currentUser.id}?page=${pageNum}&limit=${limit}`
      );
      const newRecipes = Array.isArray(data) ? data : [];

      if (isLoadingMore) {
        // Append to existing recipes
        setRecipes((prev) => [...prev, ...newRecipes]);
      } else {
        // Replace recipes (initial load)
        setRecipes(newRecipes);
      }

      // Check if there are more recipes
      setHasMore(newRecipes.length === limit);
      setPage(pageNum);
    } catch (err: any) {
      console.error('Error fetching recipes:', err);
      toast.error('Không thể tải công thức');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchMyRecipes(page + 1);
    }
  };

  const handleDelete = async (recipeId: string) => {
    if (!confirm('Bạn có chắc muốn xóa công thức này?')) return;

    try {
      await api.delete(`/recipes/${recipeId}`);
      toast.success('Đã xóa công thức');
      setRecipes(recipes.filter((r) => r.id !== recipeId));
    } catch (err: any) {
      console.error('Error deleting recipe:', err);
      toast.error(err?.response?.data?.message || 'Không thể xóa công thức');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Công thức của tôi</h1>
          <p className="text-gray-600 mt-1">Quản lý các công thức bạn đã tạo</p>
        </div>
        <Button
          onClick={() => navigate('/recipes/create')}
          className="flex items-center gap-2"
        >
          <ChefHat className="h-5 w-5" />
          Tạo công thức mới
        </Button>
      </div>

      {/* Recipe Grid */}
      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group"
            >
              {/* Image */}
              <div
                className="relative h-48 cursor-pointer"
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              >
                <img
                  src={recipe.thumbnail_url || 'https://via.placeholder.com/400x300'}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <h3 className="absolute bottom-3 left-3 right-3 text-white font-bold text-lg line-clamp-2">
                  {recipe.title}
                </h3>
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      recipe.status === 'approved'
                        ? 'bg-green-500 text-white'
                        : recipe.status === 'pending'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {recipe.status === 'approved'
                      ? 'Đã duyệt'
                      : recipe.status === 'pending'
                      ? 'Chờ duyệt'
                      : 'Từ chối'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="text-orange-500">⏱️</span> {recipe.cooking_time}m
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-blue-500">🍽️</span> {recipe.servings}
                  </span>
                </div>
                
                {recipe.description && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {recipe.description}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1"
                    onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
                  >
                    <Edit className="h-4 w-4" />
                    Sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(recipe.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <ChefHat className="h-24 w-24 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Chưa có công thức nào
          </h3>
          <p className="text-gray-500 mb-6">
            Hãy tạo công thức đầu tiên của bạn!
          </p>
          <Button onClick={() => navigate('/recipes/create')}>
            <ChefHat className="h-5 w-5 mr-2" />
            Tạo công thức mới
          </Button>
        </div>
      )}

      {/* Load More Button */}
      {recipes.length > 0 && hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            variant="outline"
            size="lg"
            className="min-w-[200px]"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Đang tải...
              </>
            ) : (
              'Tải thêm'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
