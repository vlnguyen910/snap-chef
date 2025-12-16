import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RecipeCard from './RecipeCard';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';
// Import useMock từ file api cấu hình lúc nãy
import { api, useMock } from '@/lib/axios'; 
import { useDebounce } from '@/hooks/useDebounce';
import type { Recipe } from '@/types';

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
  
  // State lưu toàn bộ dữ liệu gốc lấy từ Mock
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]); 
  
  const [filters, setFilters] = useState({
    cuisine: '',
    difficulty: '',
    maxTime: '',
  });

  const debouncedSearch = useDebounce(searchQuery, 500);

  // 1. Hàm chỉ nhiệm vụ Fetch data về
  const fetchRecipes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // GỌI MOCK SERVER: Dùng useMock('Success')
      // Lưu ý: Mock server trả về 1 cục Array phẳng, không phải paginated
      const rawData: any = await api.get('/recipes', useMock('Success'));
      
      // MAPPING DỮ LIỆU: Convert từ API (snake_case) -> App (camelCase)
      // Nếu API trả về { data: [...] } thì sửa thành rawData.data.map...
      const mappedData: Recipe[] = (Array.isArray(rawData) ? rawData : []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        // Map các trường lệch tên
        imageUrl: item.thumnail_url || item.image_url || '', 
        cookingTime: item.cooking_time,
        servings: item.serving,
        status: 'approved', // Mock chưa có field này, fake tạm
        featured: false,
        userId: 'user-01', // Fake tạm
        averageRating: 4.5, // Fake tạm để hiện sao
        ratingsCount: 10,
        forksCount: 5,
        ...item // Giữ lại các trường đã khớp
      }));

      setAllRecipes(mappedData); // Lưu vào kho gốc
      setRecipes(mappedData);    // Lưu vào list hiển thị
      
    } catch (err: any) {
      console.error(err);
      setError('Failed to load recipes. Make sure Postman Mock is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Effect 1: Load dữ liệu lần đầu tiên
  useEffect(() => {
    fetchRecipes();
  }, [userId]); // Load lại nếu đổi user, còn search/filter thì xử lý client

  // Effect 2: Xử lý Lọc Client-side (Vì Mock Server không biết lọc)
  useEffect(() => {
    let result = [...allRecipes];

    // 1. Lọc theo Search
    if (debouncedSearch) {
      const lowerQuery = debouncedSearch.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(lowerQuery) || 
        r.description?.toLowerCase().includes(lowerQuery)
      );
    }

    // 2. Lọc theo Filters (Ví dụ mẫu, bạn tự bổ sung logic)
    if (filters.maxTime) {
      result = result.filter(r => r.cookingTime <= parseInt(filters.maxTime));
    }
    // if (filters.difficulty) ...
    // if (filters.cuisine) ...

    setRecipes(result);
  }, [debouncedSearch, filters, allRecipes]);

  const clearFilters = () => {
    setFilters({ cuisine: '', difficulty: '', maxTime: '' });
    setSearchQuery('');
  };

  if (isLoading) return <Loading message="Loading recipes..." />;
  if (error) return <ErrorState message={error} onRetry={fetchRecipes} />;

  return (
    <div className="space-y-6">
      {/* ... Phần Search và Filters GIỮ NGUYÊN Code cũ của bạn ... */}
      
      {/* Phần render Grid */}
       <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        {/* ... (Search input code cũ) ... */}
       </div>

      {recipes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No recipes found</p>
          <Button variant="outline" onClick={clearFilters} className="mt-4">Clear all filters</Button>
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