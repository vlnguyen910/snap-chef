import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { api } from '@/lib/axios';
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

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 9; // 9 recipes per page (3x3 grid)

  useDocumentTitle('Favorites');

  useEffect(() => {
    fetchFavorites(1);
  }, []);

  const fetchFavorites = async (pageNum: number) => {
    try {
      const isLoadingMore = pageNum > 1;
      if (isLoadingMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const data = await api.get<any[]>(
        `/users/me/likes?page=${pageNum}&limit=${limit}`
      );
      const newRecipes = data.map((item: any) => item.recipe).filter(Boolean);

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
      console.error('Error fetching favorites:', err);
      toast.error('Không thể tải công thức yêu thích');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchFavorites(page + 1);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Công thức yêu thích</h1>
        <p className="text-gray-600 mt-1">Các công thức bạn đã lưu và thích</p>
      </div>

      {/* Recipe Grid */}
      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => navigate(`/recipes/${recipe.id}`)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
            >
              {/* Image */}
              <div className="relative h-48">
                <img
                  src={recipe.thumbnail_url || 'https://via.placeholder.com/400x300'}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <h3 className="absolute bottom-3 left-3 right-3 text-white font-bold text-lg line-clamp-2">
                  {recipe.title}
                </h3>
                
                {/* Heart Icon */}
                <div className="absolute top-3 right-3">
                  <div className="bg-red-500 p-2 rounded-full">
                    <Heart className="h-5 w-5 text-white fill-white" />
                  </div>
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
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Heart className="h-24 w-24 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Chưa có công thức yêu thích
          </h3>
          <p className="text-gray-500">
            Khám phá và lưu các công thức bạn thích!
          </p>
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
