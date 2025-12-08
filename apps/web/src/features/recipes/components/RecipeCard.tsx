import { Link } from 'react-router-dom';
import { Clock, Users, Star, Heart, GitFork } from 'lucide-react';
import type { Recipe } from '@/types';
import { useRecipeActions } from '../hooks/useRecipeActions';

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const { toggleFavorite, isFavorited, isLoading } = useRecipeActions();

  const isFavorite = isFavorited(recipe.id);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/recipes/${recipe.id}`}>
        <div className="aspect-video bg-gray-200 relative overflow-hidden">
          {recipe.imageUrl ? (
            <img 
              src={recipe.imageUrl} 
              alt={recipe.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-2">
            {recipe.status === 'pending' && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">
                Pending
              </span>
            )}
            {recipe.status === 'approved' && recipe.featured && (
              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full font-medium">
                Featured
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4 space-y-3">
        <Link to={`/recipes/${recipe.id}`}>
          <h3 className="font-semibold text-lg text-gray-900 hover:text-orange-600 transition-colors line-clamp-2">
            {recipe.title}
          </h3>
        </Link>

        <p className="text-sm text-gray-600 line-clamp-2">
          {recipe.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>{recipe.cookingTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>{recipe.servings} servings</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1 text-yellow-500">
              <Star size={16} fill="currentColor" />
              <span className="font-medium">{recipe.averageRating?.toFixed(1) || '0.0'}</span>
              <span className="text-gray-400">({recipe.ratingsCount || 0})</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <GitFork size={16} />
              <span>{recipe.forksCount || 0}</span>
            </div>
          </div>

          <button
            onClick={() => toggleFavorite(recipe.id)}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <Heart 
              size={20} 
              className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}
            />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>by</span>
          <Link 
            to={`/profile/${recipe.userId}`}
            className="font-medium text-orange-600 hover:text-orange-700"
          >
            {recipe.user?.name || 'Unknown'}
          </Link>
          {recipe.originalRecipeId && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <GitFork size={12} />
                Forked
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
