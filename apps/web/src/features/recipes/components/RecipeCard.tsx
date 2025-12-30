import { Link, useNavigate } from 'react-router-dom';
import { Clock, Users, Heart, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import type { Recipe } from '@/types';
import { useRecipeActions } from '../hooks/useRecipeActions';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { RatingDisplay } from '@/components/common/RatingDisplay';
import { ShareButton } from '@/components/common/ShareButton';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const { toggleFavorite, isFavorited, isLoading } = useRecipeActions();
  const { isAuthenticated, user } = useStore();
  const navigate = useNavigate();
  
  // Local state for like count - initialized from props
  const [likeCount, setLikeCount] = useState(recipe.favoriteCount || 0);
  const isFavorite = isFavorited(recipe.id);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Authentication check - prevent guest users from spamming
    if (!isAuthenticated || !user) {
      toast.error('Please login to like recipes');
      navigate('/auth/signin');
      return;
    }
    
    // Immediately update the count based on current like state
    if (isFavorite) {
      // Currently liked -> clicking will unlike -> decrement
      setLikeCount(prev => Math.max(0, prev - 1));
    } else {
      // Currently not liked -> clicking will like -> increment
      setLikeCount(prev => prev + 1);
    }
    
    // Toggle favorite in background
    await toggleFavorite(recipe.id);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <Link to={`/recipes/${recipe.id}`}>
        <div className="aspect-video bg-gray-200 relative overflow-hidden">
          {recipe.imageUrl ? (
            <img 
              src={recipe.imageUrl} 
              alt={recipe.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/>
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

      <div className="p-4 space-y-3 flex-1 flex flex-col">
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

        {/* Rating Display */}
        <div className="py-2">
          <RatingDisplay 
            averageRating={recipe.averageRating || recipe.rating || 0}
            ratingCount={recipe.ratingsCount || recipe.reviewCount || 0}
            size="sm"
          />
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          {/* Left: Like, Comment, Share */}
          <div className="flex items-center gap-1">
            {/* Like Button */}
            <button
              onClick={handleLikeClick}
              disabled={isLoading}
              className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 group"
              title="Like recipe"
            >
              <Heart 
                size={18} 
                className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500 group-hover:text-red-500'}
              />
              {likeCount > 0 && (
                <span className="text-xs text-gray-600">
                  {likeCount}
                </span>
              )}
            </button>

            {/* Comment Button */}
            <Link to={`/recipes/${recipe.id}#comments`}>
              <button
                className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-full transition-colors group"
                title="View comments"
              >
                <MessageCircle 
                  size={18} 
                  className="text-gray-500 group-hover:text-blue-600"
                />
                {(recipe.reviewCount || 0) > 0 && (
                  <span className="text-xs text-gray-600">
                    {recipe.reviewCount}
                  </span>
                )}
              </button>
            </Link>

            {/* Share Button */}
            <ShareButton 
              recipeId={recipe.id}
              recipeTitle={recipe.title}
              size="sm"
            />
          </div>

          {/* Right: Bookmark */}
          <div>
            <BookmarkButton 
              recipeId={recipe.id} 
              size="sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>by</span>
          <Link 
            to={`/users/${recipe.userId || recipe.authorId}/profile`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-orange-600 hover:text-orange-700 hover:underline transition-colors"
          >
            {recipe.user?.name || recipe.author?.username || 'Unknown'}
          </Link>
        </div>
      </div>
    </div>
  );
}
