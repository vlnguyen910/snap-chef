import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Users, Calendar, ArrowLeft, ChefHat } from 'lucide-react';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';
import { api } from '@/lib/axios';

// Recipe data interface matching the provided JSON structure
interface RecipeData {
  id: number;
  author_id: string;
  title: string;
  description: string | null;
  servings: number;
  cooking_time: number; // in hours
  thumbnail_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Mock ingredients data
const mockIngredients = [
  { id: 1, name: 'Fresh fish fillets', quantity: '500', unit: 'g', checked: false },
  { id: 2, name: 'Coconut water', quantity: '200', unit: 'ml', checked: false },
  { id: 3, name: 'Fish sauce', quantity: '3', unit: 'tbsp', checked: false },
  { id: 4, name: 'Sugar', quantity: '2', unit: 'tbsp', checked: false },
  { id: 5, name: 'Black pepper', quantity: '1', unit: 'tsp', checked: false },
  { id: 6, name: 'Garlic cloves', quantity: '4', unit: 'cloves', checked: false },
  { id: 7, name: 'Shallots', quantity: '2', unit: 'pieces', checked: false },
  { id: 8, name: 'Vegetable oil', quantity: '2', unit: 'tbsp', checked: false },
  { id: 9, name: 'Caramel sauce', quantity: '2', unit: 'tbsp', checked: false },
  { id: 10, name: 'Fresh chili peppers', quantity: '2', unit: 'pieces', checked: false },
];

// Mock cooking instructions
const mockInstructions = [
  {
    step: 1,
    instruction: 'Clean the fish fillets thoroughly and cut into medium-sized pieces. Pat dry with paper towels.',
  },
  {
    step: 2,
    instruction: 'Mince the garlic and shallots. Slice the chili peppers diagonally.',
  },
  {
    step: 3,
    instruction: 'In a clay pot or deep pan, heat the vegetable oil over medium heat. Add the minced garlic and shallots, sauté until fragrant.',
  },
  {
    step: 4,
    instruction: 'Add the caramel sauce and stir well. Place the fish pieces in the pot, making sure they are coated with the caramel mixture.',
  },
  {
    step: 5,
    instruction: 'Pour in the coconut water, fish sauce, sugar, and black pepper. Bring to a boil.',
  },
  {
    step: 6,
    instruction: 'Reduce heat to low, cover the pot, and let it simmer for 45-60 minutes until the sauce thickens and the fish is tender.',
  },
  {
    step: 7,
    instruction: 'Add the chili peppers in the last 10 minutes of cooking for extra flavor.',
  },
  {
    step: 8,
    instruction: 'Once done, turn off the heat and let it rest for 5 minutes. Serve hot with steamed rice.',
  },
];

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // For demo purposes, using mock data
      // In production, uncomment the API call below
      // const response = await api.get<{ recipe: RecipeData }>(`/recipes/${id}`);
      // setRecipe(response.recipe);
      
      // Mock data based on provided JSON
      const mockRecipe: RecipeData = {
        id: 1,
        author_id: 'cmj9g22de00001wf4ux8wln9d',
        title: 'Ca kho vai beep',
        description: null,
        servings: 3,
        cooking_time: 1,
        thumbnail_url: 'https://cdnv2.tgdd.vn/mwg-static/common/Common/05052025%20-%202025-05-09T154044.858.jpg',
        status: 'DRAFT',
        created_at: '2025-12-17T03:20:57.425Z',
        updated_at: '2025-12-17T03:20:57.425Z',
      };
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setRecipe(mockRecipe);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load recipe');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIngredient = (ingredientId: number) => {
    setCheckedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId);
      } else {
        newSet.add(ingredientId);
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

  const formatCookingTime = (hours: number) => {
    if (hours < 1) {
      return `${hours * 60} minutes`;
    } else if (hours === 1) {
      return '1 hour';
    } else {
      return `${hours} hours`;
    }
  };

  const getAuthorName = (authorId: string) => {
    // Placeholder author name
    return 'Chef Sarah Williams';
  };

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchRecipe} fullScreen />;
  if (!recipe) return <ErrorState title="Recipe not found" fullScreen />;

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
                    <span className="font-medium text-gray-800">{formatCookingTime(recipe.cooking_time)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                    <Users className="text-orange-500" size={20} />
                    <span className="font-medium text-gray-800">{recipe.servings} servings</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                    <Calendar className="text-orange-500" size={20} />
                    <span className="font-medium text-gray-800">{formatDate(recipe.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-orange-500 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                    <ChefHat className="text-white" size={20} />
                    <span className="font-medium text-white">{getAuthorName(recipe.author_id)}</span>
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
                    
                    <div className="bg-orange-50 rounded-xl p-6 space-y-3">
                      {mockIngredients.map((ingredient) => (
                        <label
                          key={ingredient.id}
                          className="flex items-start gap-3 cursor-pointer group hover:bg-orange-100 p-2 rounded-lg transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checkedIngredients.has(ingredient.id)}
                            onChange={() => toggleIngredient(ingredient.id)}
                            className="mt-1 w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500 focus:ring-2 cursor-pointer"
                          />
                          <span className={`flex-1 text-gray-700 ${checkedIngredients.has(ingredient.id) ? 'line-through text-gray-400' : ''}`}>
                            <span className="font-semibold">{ingredient.quantity} {ingredient.unit}</span> {ingredient.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Instructions Section */}
                <div className="md:col-span-3">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-1 h-8 bg-orange-500 rounded-full" />
                    Instructions
                  </h2>
                  
                  <div className="space-y-6">
                    {mockInstructions.map((instruction) => (
                      <div key={instruction.step} className="flex gap-4 group">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                            {instruction.step}
                          </div>
                        </div>
                        <div className="flex-1 pt-2">
                          <p className="text-gray-700 leading-relaxed text-lg">
                            {instruction.instruction}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
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
