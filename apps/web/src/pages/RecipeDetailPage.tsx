import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, Users, Calendar, ArrowLeft, ChefHat, Edit, Trash2, UserPlus, Bookmark, Heart } from 'lucide-react';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';
import { RecipeComments } from '@/components/common/RecipeComments';
import { recipeService } from '@/services/recipeService';
import { api } from '@/lib/axios';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast-store';

// Base Ingredient interface from API
interface IngredientFromAPI {
  id: number;
  name: string;
}

// Recipe Ingredient interface matching backend response
interface RecipeIngredient {
  ingredient_id: number;
  quantity: number;
  unit: string;
  ingredient?: IngredientFromAPI; // Optional nested ingredient
}

// Ingredient interface for display
interface Ingredient {
  name: string; 
  quantity: number;
  unit: string;
  checked?: boolean;
}

// Step interface matching backend response
interface Step {
  order_index: number;
  content: string;
  image_url?: string;
}

// Recipe data interface matching backend API response
interface RecipeData {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  servings: number; // Plural
  cooking_time: number; // in minutes (snake_case)
  thumbnail_url: string;
  status: string;
  ingredients: RecipeIngredient[]; // Changed to RecipeIngredient[]
  steps: Step[];
  created_at: string;
  updated_at: string;
}

// Author data interface
interface AuthorData {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useStore();
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [author, setAuthor] = useState<AuthorData | null>(null);
  const [allIngredients, setAllIngredients] = useState<IngredientFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    if (!id) {
      setError('Recipe ID is missing');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch recipe details and all ingredients in parallel
      const [recipeResponse, ingredientsResponse] = await Promise.all([
        api.get<any>(`/recipes/${id}`),
        api.get<IngredientFromAPI[]>('/ingredients').catch(() => [])
      ]);
      
      // Fetch author details if author_id exists
      let authorResponse = null;
      if (recipeResponse.author_id) {
        try {
          // Fetch public profile with follow status
          const profileResponse = await api.get<{ user: AuthorData; is_followed: boolean }>(
            `/users/${recipeResponse.author_id}/profile`
          );
          authorResponse = profileResponse.user;
          
          // Set follow status from API
          if (profileResponse.is_followed !== undefined) {
            setIsFollowing(profileResponse.is_followed);
          }
        } catch (authorError) {
          console.warn('Failed to fetch author details:', authorError);
        }
      }
      
      // ✅ BATCH STATE UPDATES - Only 1 re-render instead of 3!
      if (Array.isArray(ingredientsResponse) && ingredientsResponse.length > 0) {
        setAllIngredients(ingredientsResponse);
      }
      setRecipe(recipeResponse);
      if (authorResponse) {
        setAuthor(authorResponse);
      }
      
      // ✅ Set like status from API response
      if (recipeResponse.is_liked !== undefined) {
        setIsLiked(recipeResponse.is_liked);
      }
      if (recipeResponse.likes_count !== undefined) {
        setLikeCount(recipeResponse.likes_count);
      }
    } catch (err: any) {
      console.error('❌ Error fetching recipe:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load recipe';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ OWNERSHIP LOGIC: Check if logged-in user is the recipe owner (memoized)
  const isOwner = useMemo(() => user?.id === recipe?.author_id, [user?.id, recipe?.author_id]);

  // Handle Toggle Like with Optimistic UI
  const handleLike = async () => {
    if (!id) return;

    // Check if user is logged in
    if (!user) {
      toast.warning('Please login to like this recipe');
      navigate('/auth');
      return;
    }

    // Prevent spamming
    if (isLikeLoading) return;

    // Optimistic UI Update
    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;

    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);
    setIsLikeLoading(true);

    try {
      const response = await api.post<{ is_liked: boolean }>(`/recipes/${id}/like`);
      
      // Sync with server response
      setIsLiked(response.is_liked);
      
      toast.success(response.is_liked ? '❤️ Liked!' : 'Unliked');
    } catch (error: any) {
      // Revert optimistic update on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);

      if (error.response?.status === 401) {
        toast.error('Please login to like recipes');
        navigate('/auth');
      } else if (error.response?.status === 403) {
        toast.error('You cannot like your own recipe!');
      } else {
        toast.error('Failed to update like status');
      }
    } finally {
      setIsLikeLoading(false);
    }
  };

  // Handle Toggle Bookmark with Optimistic UI
  const handleBookmark = async () => {
    if (!id) return;

    // Check if user is logged in
    if (!user) {
      toast.warning('Please login to bookmark this recipe');
      navigate('/auth');
      return;
    }

    // Prevent spamming
    if (isBookmarkLoading) return;

    // Optimistic UI Update
    const previousIsBookmarked = isBookmarked;
    const newIsBookmarked = !isBookmarked;

    setIsBookmarked(newIsBookmarked);
    setIsBookmarkLoading(true);

    try {
      // Note: Backend bookmark API doesn't exist yet - this will fail
      // TODO: Implement backend bookmark API
      await api.post(`/recipes/${id}/bookmark`);
      
      toast.success(newIsBookmarked ? '🔖 Bookmarked!' : 'Removed from bookmarks');
    } catch (error: any) {
      // Revert optimistic update on error
      setIsBookmarked(previousIsBookmarked);

      if (error.response?.status === 401) {
        toast.error('Please login to bookmark recipes');
        navigate('/auth/signin');
      } else {
        toast.error('Failed to update bookmark status');
      }
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  // Handle Follow Author with Optimistic UI
  const handleFollowAuthor = async () => {
    if (!recipe?.author_id) return;

    // Check if user is logged in
    if (!user) {
      toast.warning('Please login to follow users');
      navigate('/auth/signin');
      return;
    }

    // Prevent following yourself
    if (user.id === recipe.author_id) {
      toast.error('You cannot follow yourself!');
      return;
    }

    // Prevent spamming
    if (isFollowLoading) return;

    // Optimistic UI Update
    const previousIsFollowing = isFollowing;
    const newIsFollowing = !isFollowing;

    setIsFollowing(newIsFollowing);
    setIsFollowLoading(true);

    try {
      // Backend handles toggle logic - always POST
      const response = await api.post<{ message: string }>(`/users/${recipe.author_id}/follow`);
      
      toast.success(newIsFollowing ? '✅ Following!' : 'Unfollowed');
    } catch (error: any) {
      // Revert optimistic update on error
      setIsFollowing(previousIsFollowing);

      if (error.response?.status === 401) {
        toast.error('Please login to follow users');
        navigate('/auth/signin');
      } else if (error.response?.status === 404) {
        toast.error('User not found');
      } else {
        toast.error('Failed to update follow status');
      }
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Handle Delete Recipe
  const handleDeleteRecipe = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa công thức này?')) {
      return;
    }

    try {
      await api.delete(`/recipes/${id}`);
      toast.success('Công thức đã được xóa!');
      navigate('/recipes');
    } catch (error: any) {
      console.error('❌ Error deleting recipe:', error);
      toast.error('Không thể xóa công thức: ' + (error.response?.data?.message || error.message));
    }
  };

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCookingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} mins`;
    } else if (minutes === 60) {
      return '1 hour';
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
    }
  };

  const getAuthorName = () => {
    if (author) {
      if (author.firstName && author.lastName) {
        return `${author.firstName} ${author.lastName}`;
      }
      return author.username || 'Unknown Chef';
    }
    return 'Loading...';
  };

  // ✅ DEFENSIVE: Get servings (check both singular and plural)
  const getServings = () => {
    if (!recipe) return 1;
    return recipe.servings || (recipe as any).serving || 1;
  };

  // ✅ DEFENSIVE: Get cooking time (check both snake_case and camelCase)
  const getCookingTime = () => {
    if (!recipe) return 0;
    return recipe.cooking_time || (recipe as any).cookingTime || 0;
  };

  // ✅ DEFENSIVE: Parse ingredients with flexible field mapping and ID-to-name resolution (memoized)
  const getIngredients = useMemo(() => {
    if (!recipe?.ingredients || !Array.isArray(recipe.ingredients)) {
      return [];
    }

    return recipe.ingredients.map((item: any, index: number) => {
      const amount = item.quantity || item.quanity || item.amount || 0;
      const unit = item.unit || '';
      
      // Try to get name from multiple sources
      let name = 'Unknown ingredient';
      
      if (item.name) {
        name = item.name;
      } else if (item.ingredient?.name) {
        name = item.ingredient.name;
      } else if (item.ingredient_id && allIngredients.length > 0) {
        const foundIngredient = allIngredients.find(ing => ing.id === item.ingredient_id);
        if (foundIngredient) {
          name = foundIngredient.name;
        }
      }

      return {
        name,
        amount,
        unit,
        index,
      };
    });
  }, [recipe?.ingredients, allIngredients]);

  // ✅ DEFENSIVE: Parse steps with flexible field mapping (memoized)
  const getSteps = useMemo(() => {
    if (!recipe?.steps || !Array.isArray(recipe.steps)) {
      return [];
    }

    return recipe.steps
      .map((item: any, index: number) => {
        const content = item.content || item.instruction || '';
        const orderIndex = item.order_index !== undefined ? item.order_index : (item.step || index + 1);
        const imageUrl = item.image_url || item.imageUrl || '';

        return {
          order_index: orderIndex,
          content,
          image_url: imageUrl,
        };
      })
      .sort((a, b) => a.order_index - b.order_index);
  }, [recipe?.steps]);

  const ingredients = getIngredients;
  const steps = getSteps;

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchRecipe} fullScreen />;
  if (!recipe) return <ErrorState title="Recipe not found" message="The recipe you're looking for doesn't exist." fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Thumbnail Banner */}
            <div className="relative h-[400px] md:h-[500px] overflow-hidden">
              <img 
                src={recipe.thumbnail_url} 
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              
              {/* Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                  {recipe.title}
                </h1>
                
                {/* Metadata Badges */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                    <Clock className="text-orange-500" size={20} />
                    <span className="font-medium text-gray-800">{formatCookingTime(getCookingTime())}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                    <Users className="text-orange-500" size={20} />
                    <span className="font-medium text-gray-800">{getServings()} servings</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                    <Calendar className="text-orange-500" size={20} />
                    <span className="font-medium text-gray-800">{formatDate(recipe.created_at)}</span>
                  </div>
                  
                  <Link 
                    to={`/users/${recipe.author_id}/profile`}
                    className="flex items-center gap-2 bg-orange-500 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg hover:bg-orange-600 transition-colors group"
                  >
                    <ChefHat className="text-white" size={20} />
                    <span className="font-medium text-white group-hover:underline">By {getAuthorName()}</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 md:p-10">
              {/* Action Bar - Conditional based on ownership */}
              <div className="mb-8 pb-6 border-b border-gray-200">
                {isOwner ? (
                  /* CASE A: Owner Actions */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
                        Your Recipe
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link to={`/recipes/${id}/edit`}>
                        <Button
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Edit size={18} className="mr-2" />
                          Chỉnh sửa
                        </Button>
                      </Link>
                      <Button
                        onClick={handleDeleteRecipe}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                      >
                        <Trash2 size={18} className="mr-2" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* CASE B: Viewer Actions (Not Owner) */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Author Info with Follow Button */}
                      <Link 
                        to={`/users/${recipe.author_id}/profile`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg group-hover:bg-orange-600 transition-colors">
                          {getAuthorName()?.[0] || 'C'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-orange-600 group-hover:underline transition-colors">{getAuthorName()}</p>
                          <p className="text-sm text-gray-500">Recipe author</p>
                        </div>
                      </Link>
                      <Button
                        onClick={handleFollowAuthor}
                        disabled={isFollowLoading}
                        className={isFollowing ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-orange-600 hover:bg-orange-700'}
                      >
                        <UserPlus size={18} className="mr-2" />
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Like Button */}
                      <Button
                        onClick={handleLike}
                        variant="outline"
                        disabled={isLikeLoading}
                        className={isLiked ? 'border-red-500 text-red-600 hover:bg-red-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
                      >
                        <Heart 
                          size={18} 
                          className="mr-2" 
                          fill={isLiked ? 'currentColor' : 'none'}
                        />
                        {isLiked ? 'Liked' : 'Like'}
                        {likeCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs font-semibold">
                            {likeCount}
                          </span>
                        )}
                      </Button>

                      {/* Bookmark Button */}
                      <Button
                        onClick={handleBookmark}
                        variant="outline"
                        disabled={isBookmarkLoading}
                        className={isBookmarked ? 'border-orange-500 text-orange-600 hover:bg-orange-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
                      >
                        <Bookmark size={18} className="mr-2" fill={isBookmarked ? 'currentColor' : 'none'} />
                        {isBookmarked ? 'Saved' : 'Save'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Recipe</h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {recipe.description || 'No description available for this recipe.'}
                </p>
              </div>

              {/* Two Column Layout for Ingredients and Instructions */}
              <div className="grid md:grid-cols-5 gap-8">
                {/* Ingredients Section */}
                <div className="md:col-span-2">
                  <div className="sticky top-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <span className="w-1 h-8 bg-orange-500 rounded-full" />
                      Ingredients
                    </h2>
                    
                    {ingredients.length > 0 ? (
                      <div className="bg-orange-50 rounded-xl p-6 space-y-3">
                        {ingredients.map((ingredient) => (
                          <label
                            key={ingredient.index}
                            className="flex items-start gap-3 cursor-pointer group hover:bg-orange-100 p-2 rounded-lg transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={checkedIngredients.has(ingredient.index)}
                              onChange={() => toggleIngredient(ingredient.index)}
                              className="mt-1 w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500 focus:ring-2 cursor-pointer"
                            />
                            <span className={`flex-1 text-gray-700 ${checkedIngredients.has(ingredient.index) ? 'line-through text-gray-400' : ''}`}>
                              <span className="font-semibold">{ingredient.amount} {ingredient.unit}</span> {ingredient.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No ingredients listed for this recipe.</p>
                    )}
                  </div>
                </div>

                {/* Instructions Section */}
                <div className="md:col-span-3">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-1 h-8 bg-orange-500 rounded-full" />
                    Instructions
                  </h2>
                  
                  {steps.length > 0 ? (
                    <div className="space-y-6">
                      {steps.map((step, index) => (
                        <div key={index} className="flex gap-4 group">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                              {step.order_index}
                            </div>
                          </div>
                          <div className="flex-1 pt-2">
                            <p className="text-gray-700 leading-relaxed text-lg mb-3">
                              {step.content}
                            </p>
                            {step.image_url && (
                              <img 
                                src={step.image_url} 
                                alt={`Step ${step.order_index}`}
                                className="rounded-lg shadow-md max-h-96 w-full md:w-auto object-contain mt-3"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No instructions available for this recipe.</p>
                  )}
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-center text-gray-500 text-sm">
                  Enjoy your delicious meal! Don't forget to share your creation with friends and family. 🍽️
                </p>
              </div>

              {/* Comments Section */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <RecipeComments recipeOwnerId={recipe?.author_id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Spacing */}
      <div className="h-20" />
    </div>
  );
}
