import { Clock, Heart, Users } from "lucide-react";
import type { RecipeData } from "../../types/recipe-detail";

interface RecipeHeaderProps {
  recipe: RecipeData;
  formatCookingTime: (minutes: number) => string;
  getServings: () => number;
  getCookingTime: () => number;
  likeCount: number;
  isLiked: boolean;
}

export function RecipeHeader({
  recipe,
  formatCookingTime,
  getServings,
  getCookingTime,
  likeCount,
  isLiked,
}: RecipeHeaderProps) {
  const categories =
    recipe.categories && recipe.categories.length > 0
      ? recipe.categories
      : [{ name: "Featured", slug: "featured" }];

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
          {categories.map((category) => (
            <span
              key={category.slug}
              className="rounded bg-white/25 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm"
            >
              {category.name}
            </span>
          ))}
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
            <span className="text-sm font-medium">
              {getServings()} servings
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Heart
              className={`size-4 ${isLiked ? "fill-red-500 text-red-500" : "text-red-400"}`}
            />
            <span className="text-sm font-medium">{likeCount} likes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
