import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Users, ChefHat, Star, Heart, GitFork, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';
import { useRecipeActions } from '@/features/recipes/hooks/useRecipeActions';
import { api } from '@/lib/axios';
import type { Recipe } from '@/types';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toggleFavorite, isFavorited } = useRecipeActions();

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<{ recipe: Recipe }>(`/recipes/${id}`);
      setRecipe(response.data.recipe);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load recipe');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchRecipe} fullScreen />;
  if (!recipe) return <ErrorState title="Recipe not found" fullScreen />;

  const isFavorite = isFavorited(recipe.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link to="/recipes" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-6">
          <ArrowLeft size={20} />
          Back to recipes
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="aspect-video bg-gray-200 relative">
            {recipe.imageUrl ? (
              <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ChefHat size={64} />
              </div>
            )}
          </div>

          <div className="p-8 space-y-6">
            {/* Title and Actions */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
                <p className="text-gray-600">{recipe.description}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => toggleFavorite(recipe.id)}>
                  <Heart size={20} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
                </Button>
                <Button variant="outline">
                  <GitFork size={20} />
                </Button>
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-6 text-sm border-y border-gray-200 py-4">
              <div className="flex items-center gap-2">
                <Clock className="text-gray-400" size={20} />
                <span className="text-gray-600">Prep: {recipe.prepTime} min</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-gray-400" size={20} />
                <span className="text-gray-600">Cook: {recipe.cookingTime} min</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="text-gray-400" size={20} />
                <span className="text-gray-600">{recipe.servings} servings</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="text-yellow-500" size={20} fill="currentColor" />
                <span className="font-medium">{recipe.averageRating?.toFixed(1) || '0.0'}</span>
                <span className="text-gray-400">({recipe.ratingsCount || 0} ratings)</span>
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-orange-600 mt-1">•</span>
                    <span className="text-gray-700">
                      <span className="font-medium">{ingredient.quantity} {ingredient.unit}</span> {ingredient.name}
                      {ingredient.notes && <span className="text-gray-500 text-sm ml-2">({ingredient.notes})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
              <ol className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold">
                      {instruction.step}
                    </span>
                    <p className="text-gray-700 pt-1">{instruction.instruction}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Author Info */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <ChefHat className="text-orange-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recipe by</p>
                  <Link to={`/profile/${recipe.userId}`} className="font-semibold text-orange-600 hover:text-orange-700">
                    {recipe.user?.name || 'Unknown Chef'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
