import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Users, Calendar, ArrowLeft, ChefHat } from 'lucide-react';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';
import { recipeService } from '@/services/recipeService';
import { api } from '@/lib/axios';

// Ingredient interface matching backend response
interface Ingredient {
  name: string;
  quanity: number; // Backend typo - missing 't'
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
  ingredients: Ingredient[];
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
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [author, setAuthor] = useState<AuthorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

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
      console.log('🔍 Fetching recipe with ID:', id);
      
      // Fetch recipe details from API
      const response = await api.get<any>(`/recipes/${id}`);
      
      // 🐛 DEBUGGING: Log full API response to verify structure
      console.log('✅ API Response:', response);
      console.log('📦 Recipe Data:', JSON.stringify(response, null, 2));
      console.log('🥕 Ingredients:', response.ingredients);
      console.log('📝 Steps:', response.steps);
      
      setRecipe(response);

      // Fetch author details separately if author_id exists
      if (response.author_id) {
        try {
          console.log('👤 Fetching author with ID:', response.author_id);
          const authorResponse = await api.get<AuthorData>(`/users/${response.author_id}`);
          console.log('✅ Author fetched:', authorResponse);
          setAuthor(authorResponse);
        } catch (authorError) {
          console.warn('⚠️ Failed to fetch author details:', authorError);
          // Continue even if author fetch fails
        }
      }
    } catch (err: any) {
      console.error('❌ Error fetching recipe:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load recipe';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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

  // ✅ DEFENSIVE: Parse ingredients with flexible field mapping
  const getIngredients = () => {
    if (!recipe?.ingredients || !Array.isArray(recipe.ingredients)) {
      console.warn('⚠️ No ingredients array found');
      return [];
    }

    return recipe.ingredients.map((item: any, index: number) => {
      // Check multiple possible field names for amount
      const amount = item.amount || item.quantity || item.quanity || 0;
      const name = item.name || 'Unknown ingredient';
      const unit = item.unit || '';

      console.log(`🥕 Ingredient ${index + 1}:`, { name, amount, unit, raw: item });

      return {
        name,
        amount,
        unit,
        index,
      };
    });
  };

  // ✅ DEFENSIVE: Parse steps with flexible field mapping
  const getSteps = () => {
    if (!recipe?.steps || !Array.isArray(recipe.steps)) {
      console.warn('⚠️ No steps array found');
      return [];
    }

    return recipe.steps
      .map((item: any, index: number) => {
        // Check multiple possible field names for content
        const content = item.content || item.instruction || '';
        const orderIndex = item.order_index !== undefined ? item.order_index : (item.step || index + 1);
        const imageUrl = item.image_url || item.imageUrl || '';

        console.log(`📝 Step ${orderIndex}:`, { content: content.substring(0, 50), imageUrl, raw: item });

        return {
          order_index: orderIndex,
          content,
          image_url: imageUrl,
        };
      })
      .sort((a, b) => a.order_index - b.order_index); // Sort by order_index
  };

  const ingredients = getIngredients();
  const steps = getSteps();

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchRecipe} fullScreen />;
  if (!recipe) return <ErrorState title="Recipe not found" message="The recipe you're looking for doesn't exist." fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Link 
          to="/recipes" 
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back to recipes
        </Link>
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
                  
                  <div className="flex items-center gap-2 bg-orange-500 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                    <ChefHat className="text-white" size={20} />
                    <span className="font-medium text-white">By {getAuthorName()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 md:p-10">
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
                                className="rounded-lg shadow-md max-w-md w-full mt-3"
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
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Spacing */}
      <div className="h-20" />
    </div>
  );
}
