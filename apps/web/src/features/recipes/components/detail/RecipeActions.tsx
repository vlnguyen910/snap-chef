import { Link } from "react-router-dom";
import {
  Edit,
  Trash2,
  UserPlus,
  PlusSquare,
  Heart,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecipeData } from "../../types/recipe-detail";

interface RecipeActionsProps {
  recipe: RecipeData;
  isOwner: boolean;
  getAuthorName: () => string;
  isFollowing: boolean;
  isFollowLoading: boolean;
  handleFollowAuthor: () => void;
  isLiked: boolean;
  likeCount: number;
  isLikeLoading: boolean;
  handleLike: () => void;
  handleAddToCollection: () => void;
  handleShare: () => void;
  handleDeleteRecipe: () => void;
}

export function RecipeActions({
  recipe,
  isOwner,
  getAuthorName,
  isFollowing,
  isFollowLoading,
  handleFollowAuthor,
  isLiked,
  likeCount,
  isLikeLoading,
  handleLike,
  handleAddToCollection,
  handleShare,
  handleDeleteRecipe,
}: RecipeActionsProps) {
  if (isOwner) {
    return (
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-card p-4 shadow-sm sm:flex-row sm:items-center dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            Your Recipe
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/recipes/${recipe.id}/edit`}>
            <Button
              variant="outline"
              className="h-10 border-slate-200 px-4 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Edit size={18} className="mr-2" />
              Chỉnh sửa
            </Button>
          </Link>
          <Button
            onClick={handleDeleteRecipe}
            variant="outline"
            className="h-10 border-red-200 px-4 text-red-500 hover:border-red-300 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <Trash2 size={18} className="mr-2" />
            Xóa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-card p-4 shadow-sm dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <Link
          to={`/users/${recipe.author_id}/profile`}
          className="flex items-center gap-3 group"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-primary/15 text-xl font-bold text-primary transition-colors group-hover:bg-primary/20">
            {getAuthorName()?.[0] || "C"}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 transition-colors group-hover:text-primary dark:text-white">
              {getAuthorName()}
            </p>
            <p className="text-sm text-slate-500">Recipe author</p>
          </div>
        </Link>
        <Button
          onClick={handleFollowAuthor}
          disabled={isFollowLoading}
          className={
            isFollowing
              ? "h-10 bg-slate-200 px-5 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
              : "h-10 bg-primary px-5 text-primary-foreground hover:bg-primary/90"
          }
        >
          <UserPlus size={18} className="mr-2" />
          {isFollowing ? "Following" : "Follow"}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleLike}
          variant="outline"
          disabled={isLikeLoading}
          className={
            isLiked
              ? "h-10 border-red-300 text-red-500 hover:bg-red-50 dark:border-red-900/70 dark:text-red-400 dark:hover:bg-red-950/30"
              : "h-10 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          }
        >
          <Heart
            size={18}
            className="mr-2"
            fill={isLiked ? "currentColor" : "none"}
          />
          {isLiked ? "Liked" : "Like"}
          {likeCount > 0 && (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {likeCount}
            </span>
          )}
        </Button>

        <Button
          onClick={handleAddToCollection}
          variant="outline"
          className="h-10 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <PlusSquare size={18} className="mr-2" />
          Add to collection
        </Button>

        <Button
          onClick={handleShare}
          variant="outline"
          className="h-10 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Share2 size={18} className="mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
}
