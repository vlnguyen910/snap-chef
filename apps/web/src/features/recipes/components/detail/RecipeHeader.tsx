import { Link } from 'react-router-dom';
import { Clock, Users, Calendar, ChefHat } from 'lucide-react';
import type { RecipeData, AuthorData } from '../../types/recipe-detail';

interface RecipeHeaderProps {
  recipe: RecipeData;
  author: AuthorData | null;
  formatCookingTime: (minutes: number) => string;
  getServings: () => number;
  getCookingTime: () => number;
  formatDate: (dateString: string) => string;
  getAuthorName: () => string;
}

export function RecipeHeader({
  recipe,
  author,
  formatCookingTime,
  getServings,
  getCookingTime,
  formatDate,
  getAuthorName
}: RecipeHeaderProps) {
  return (
    <div className="relative h-[400px] md:h-[500px] overflow-hidden">
      <img 
        src={recipe.thumbnail_url} 
        alt={recipe.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
          {recipe.title}
        </h1>
        
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
  );
}
