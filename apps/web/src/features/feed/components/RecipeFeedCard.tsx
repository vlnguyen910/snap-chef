import { Bookmark, Clock, Star, MoreHorizontal } from 'lucide-react';
import type { RecipeFeedItem } from '../data/mockData';

interface RecipeFeedCardProps {
  recipe: Readonly<RecipeFeedItem>;
  onBookmark?: (id: string) => void;
}

const DIFFICULTY_COLORS: Record<RecipeFeedItem['difficulty'], string> = {
  Beginner: 'bg-green-600',
  Intermediate: 'bg-amber-600',
  Pro: 'bg-rose-600',
};

export default function RecipeFeedCard({ recipe, onBookmark }: Readonly<RecipeFeedCardProps>) {
  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-shadow group cursor-pointer">
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Bookmark button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBookmark?.(recipe.id);
          }}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-slate-600 hover:text-primary transition-colors"
          aria-label="Bookmark recipe"
        >
          <Bookmark size={18} />
        </button>
        {/* Difficulty badge */}
        <div className="absolute bottom-3 left-3">
          <span
            className={`px-2 py-1 rounded text-white text-[10px] font-bold uppercase ${DIFFICULTY_COLORS[recipe.difficulty]}`}
          >
            {recipe.difficulty}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-base font-bold mb-3 line-clamp-1 group-hover:text-primary transition-colors">
          {recipe.title}
        </h3>

        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm mb-4">
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>{recipe.cookTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-900 dark:text-white">{recipe.rating.toFixed(1)}</span>
            <span>({recipe.ratingCount})</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <img
              src={recipe.authorAvatar}
              alt={recipe.author}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-xs font-semibold">{recipe.author}</span>
          </div>
          <MoreHorizontal size={18} className="text-slate-300" />
        </div>
      </div>
    </div>
  );
}
