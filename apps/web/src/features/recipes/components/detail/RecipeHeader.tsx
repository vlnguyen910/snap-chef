import { Link } from "react-router-dom";
import { Clock, Users, Star, ChefHat } from "lucide-react";
import type { RecipeData, AuthorData } from "../../types/recipe-detail";

interface RecipeHeaderProps {
  recipe: RecipeData;
  author: AuthorData | null;
  formatCookingTime: (minutes: number) => string;
  getServings: () => number;
  getCookingTime: () => number;
  getAuthorName: () => string;
  likeCount: number;
}

export function RecipeHeader({
  recipe,
  author,
  formatCookingTime,
  getServings,
  getCookingTime,
  getAuthorName,
  likeCount,
}: RecipeHeaderProps) {
  const cuisineLabel = recipe.status
    ? recipe.status.charAt(0).toUpperCase() + recipe.status.slice(1)
    : "Featured";

  return (
    <div className="relative overflow-hidden rounded-xl group">
      <img
        src={recipe.thumbnail_url}
        alt={recipe.title}
        className="h-[360px] w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-[420px]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
            {cuisineLabel}
          </span>
          <span className="rounded bg-white/25 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
            Homemade
          </span>
        </div>

        <h1 className="text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
          {recipe.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-white/95">
          <div className="flex items-center gap-1">
            <Clock className="size-4 text-primary" />
            <span className="text-sm font-medium">
              {formatCookingTime(getCookingTime())}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Users className="size-4 text-primary" />
            <span className="text-sm font-medium">{getServings()} servings</span>
          </div>

          <div className="flex items-center gap-1">
            <Star className="size-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{likeCount} likes</span>
          </div>

          <Link
            to={`/users/${recipe.author_id}/profile`}
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
          </Link>
        </div>
      </div>
    </div>
  );
}
