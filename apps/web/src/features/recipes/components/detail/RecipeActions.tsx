import { Link } from "react-router-dom";
import { Edit, Trash2, UserPlus, Bookmark, Heart } from "lucide-react";
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
  isBookmarked: boolean;
  isBookmarkLoading: boolean;
  handleBookmark: () => void;
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
  isBookmarked,
  isBookmarkLoading,
  handleBookmark,
  handleDeleteRecipe,
}: RecipeActionsProps) {
  if (isOwner) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
            Your Recipe
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/recipes/${recipe.id}/edit`}>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Edit size={18} className="mr-2" />
              Chỉnh sửa
            </Button>
          </Link>
          <Button
            onClick={handleDeleteRecipe}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
          >
            <Trash2 size={18} className="mr-2" />
            Xóa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/users/${recipe.author_id}/profile`}
          className="flex items-center gap-3 group"
        >
          <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg group-hover:bg-orange-600 transition-colors">
            {getAuthorName()?.[0] || "C"}
          </div>
          <div>
            <p className="font-semibold text-gray-900 group-hover:text-orange-600 group-hover:underline transition-colors">
              {getAuthorName()}
            </p>
            <p className="text-sm text-gray-500">Recipe author</p>
          </div>
        </Link>
        <Button
          onClick={handleFollowAuthor}
          disabled={isFollowLoading}
          className={
            isFollowing
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-orange-600 hover:bg-orange-700"
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
              ? "border-red-500 text-red-600 hover:bg-red-50"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }
        >
          <Heart
            size={18}
            className="mr-2"
            fill={isLiked ? "currentColor" : "none"}
          />
          {isLiked ? "Liked" : "Like"}
          {likeCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs font-semibold">
              {likeCount}
            </span>
          )}
        </Button>

        <Button
          onClick={handleBookmark}
          variant="outline"
          disabled={isBookmarkLoading}
          className={
            isBookmarked
              ? "border-orange-500 text-orange-600 hover:bg-orange-50"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }
        >
          <Bookmark
            size={18}
            className="mr-2"
            fill={isBookmarked ? "currentColor" : "none"}
          />
          {isBookmarked ? "Saved" : "Save"}
        </Button>
      </div>
    </div>
  );
}
