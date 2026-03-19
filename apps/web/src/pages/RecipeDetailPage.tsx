import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Loading from "@/components/common/Loading";
import ErrorState from "@/components/common/ErrorState";
import { RecipeComments } from "@/components/common/RecipeComments";
import { api } from "@/lib/axios";
import { useStore } from "@/lib/store";
import { toast } from "@/lib/toast-store";

import type {
  RecipeData,
  AuthorData,
  IngredientFromAPI,
  IngredientDisplay,
  StepFromAPI,
} from "@/features/recipes/types/recipe-detail";
import { RecipeHeader } from "@/features/recipes/components/detail/RecipeHeader";
import { RecipeActions } from "@/features/recipes/components/detail/RecipeActions";
import { IngredientList } from "@/features/recipes/components/detail/IngredientList";
import { StepList } from "@/features/recipes/components/detail/StepList";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useStore();

  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [author, setAuthor] = useState<AuthorData | null>(null);
  const [allIngredients, setAllIngredients] = useState<IngredientFromAPI[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    new Set(),
  );
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    if (!id) {
      setError("Recipe ID is missing");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [recipeResponse, ingredientsResponse] = await Promise.all([
        api.get<any>(`/recipes/${id}`),
        api.get<IngredientFromAPI[]>("/ingredients").catch(() => []),
      ]);

      let authorResponse = null;
      if (recipeResponse.author_id) {
        try {
          const profileResponse = await api.get<{
            user: AuthorData;
            is_followed: boolean;
          }>(`/users/${recipeResponse.author_id}/profile`);
          authorResponse = profileResponse.user;

          if (profileResponse.is_followed !== undefined) {
            setIsFollowing(profileResponse.is_followed);
          }
        } catch (authorError) {
          console.warn("Failed to fetch author details:", authorError);
        }
      }

      if (
        Array.isArray(ingredientsResponse) &&
        ingredientsResponse.length > 0
      ) {
        setAllIngredients(ingredientsResponse);
      }
      setRecipe(recipeResponse);
      if (authorResponse) {
        setAuthor(authorResponse);
      }

      if (recipeResponse.is_liked !== undefined) {
        setIsLiked(recipeResponse.is_liked);
      }
      if (recipeResponse.likes_count !== undefined) {
        setLikeCount(recipeResponse.likes_count);
      }
    } catch (err: any) {
      console.error("❌ Error fetching recipe:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to load recipe";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = useMemo(
    () => user?.id === recipe?.author_id,
    [user?.id, recipe?.author_id],
  );

  const handleLike = async () => {
    if (!id) return;
    if (!user) {
      toast.warning("Please login to like this recipe");
      navigate("/auth");
      return;
    }
    if (isLikeLoading) return;

    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;

    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);
    setIsLikeLoading(true);

    try {
      const response = await api.post<{ is_liked: boolean }>(
        `/recipes/${id}/like`,
      );
      setIsLiked(response.is_liked);
      toast.success(response.is_liked ? "❤️ Liked!" : "Unliked");
    } catch (error: any) {
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);

      if (error.response?.status === 401) {
        toast.error("Please login to like recipes");
        navigate("/auth");
      } else if (error.response?.status === 403) {
        toast.error("You cannot like your own recipe!");
      } else {
        toast.error("Failed to update like status");
      }
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!id) return;
    if (!user) {
      toast.warning("Please login to bookmark this recipe");
      navigate("/auth");
      return;
    }
    if (isBookmarkLoading) return;

    const previousIsBookmarked = isBookmarked;
    const newIsBookmarked = !isBookmarked;

    setIsBookmarked(newIsBookmarked);
    setIsBookmarkLoading(true);

    try {
      await api.post(`/recipes/${id}/bookmark`);
      toast.success(
        newIsBookmarked ? "🔖 Bookmarked!" : "Removed from bookmarks",
      );
    } catch (error: any) {
      setIsBookmarked(previousIsBookmarked);
      if (error.response?.status === 401) {
        toast.error("Please login to bookmark recipes");
        navigate("/auth");
      } else {
        toast.error("Failed to update bookmark status");
      }
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const handleFollowAuthor = async () => {
    if (!recipe?.author_id) return;
    if (!user) {
      toast.warning("Please login to follow users");
      navigate("/auth");
      return;
    }
    if (user.id === recipe.author_id) {
      toast.error("You cannot follow yourself!");
      return;
    }
    if (isFollowLoading) return;

    const previousIsFollowing = isFollowing;
    const newIsFollowing = !isFollowing;

    setIsFollowing(newIsFollowing);
    setIsFollowLoading(true);

    try {
      await api.post<{ message: string }>(`/users/${recipe.author_id}/follow`);
      toast.success(newIsFollowing ? "✅ Following!" : "Unfollowed");
    } catch (error: any) {
      setIsFollowing(previousIsFollowing);
      if (error.response?.status === 401) {
        toast.error("Please login to follow users");
        navigate("/auth");
      } else if (error.response?.status === 404) {
        toast.error("User not found");
      } else {
        toast.error("Failed to update follow status");
      }
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleDeleteRecipe = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa công thức này?")) {
      return;
    }

    try {
      await api.delete(`/recipes/${id}`);
      toast.success("Công thức đã được xóa!");
      navigate("/recipes");
    } catch (error: any) {
      console.error("❌ Error deleting recipe:", error);
      toast.error(
        "Không thể xóa công thức: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCookingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} mins`;
    } else if (minutes === 60) {
      return "1 hour";
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
    }
  };

  const getAuthorName = () => {
    if (author) {
      if (author.firstName && author.lastName) {
        return `${author.firstName} ${author.lastName}`;
      }
      return author.username || "Unknown Chef";
    }
    return "Loading...";
  };

  const getServings = () => {
    if (!recipe) return 1;
    return recipe.servings || (recipe as any).serving || 1;
  };

  const getCookingTime = () => {
    if (!recipe) return 0;
    return recipe.cooking_time || (recipe as any).cookingTime || 0;
  };

  const getIngredients = useMemo<IngredientDisplay[]>(() => {
    if (!recipe?.ingredients || !Array.isArray(recipe.ingredients)) {
      return [];
    }
    return recipe.ingredients.map((item: any, index: number) => {
      const amount = item.quantity || item.quanity || item.amount || 0;
      const unit = item.unit || "";
      let name = "Unknown ingredient";
      if (item.name) {
        name = item.name;
      } else if (item.ingredient?.name) {
        name = item.ingredient.name;
      } else if (item.ingredient_id && allIngredients.length > 0) {
        const foundIngredient = allIngredients.find(
          (ing) => ing.id === item.ingredient_id,
        );
        if (foundIngredient) {
          name = foundIngredient.name;
        }
      }
      return { name, amount, unit, index };
    });
  }, [recipe?.ingredients, allIngredients]);

  const getSteps = useMemo(() => {
    if (!recipe?.steps || !Array.isArray(recipe.steps)) {
      return [];
    }
    return recipe.steps
      .map((item: any, index: number) => {
        const content = item.content || item.instruction || "";
        const orderIndex =
          item.order_index !== undefined
            ? item.order_index
            : item.step || index + 1;
        const imageUrl = item.image_url || item.imageUrl || "";
        return {
          order_index: orderIndex,
          content,
          image_url: imageUrl,
        };
      })
      .sort((a, b) => a.order_index - b.order_index);
  }, [recipe?.steps]);

  const ingredients = getIngredients;
  const steps = getSteps;

  if (isLoading) return <Loading fullScreen />;
  if (error)
    return <ErrorState message={error} onRetry={fetchRecipe} fullScreen />;
  if (!recipe)
    return (
      <ErrorState
        title="Recipe not found"
        message="The recipe you're looking for doesn't exist."
        fullScreen
      />
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back
        </button>
      </div>

      <div className="relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <RecipeHeader
              recipe={recipe}
              author={author}
              formatCookingTime={formatCookingTime}
              getServings={getServings}
              getCookingTime={getCookingTime}
              formatDate={formatDate}
              getAuthorName={getAuthorName}
            />

            <div className="p-6 md:p-10">
              <div className="mb-8 pb-6 border-b border-gray-200">
                <RecipeActions
                  recipe={recipe}
                  isOwner={isOwner}
                  getAuthorName={getAuthorName}
                  isFollowing={isFollowing}
                  isFollowLoading={isFollowLoading}
                  handleFollowAuthor={handleFollowAuthor}
                  isLiked={isLiked}
                  likeCount={likeCount}
                  isLikeLoading={isLikeLoading}
                  handleLike={handleLike}
                  isBookmarked={isBookmarked}
                  isBookmarkLoading={isBookmarkLoading}
                  handleBookmark={handleBookmark}
                  handleDeleteRecipe={handleDeleteRecipe}
                />
              </div>

              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  About This Recipe
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {recipe.description ||
                    "No description available for this recipe."}
                </p>
              </div>

              <div className="grid md:grid-cols-5 gap-8">
                <div className="md:col-span-2">
                  <IngredientList
                    ingredients={ingredients}
                    checkedIngredients={checkedIngredients}
                    setCheckedIngredients={setCheckedIngredients}
                  />
                </div>

                <div className="md:col-span-3">
                  <StepList steps={steps} />
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-center text-gray-500 text-sm">
                  Enjoy your delicious meal! Don't forget to share your creation
                  with friends and family. 🍽️
                </p>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <RecipeComments recipeOwnerId={recipe?.author_id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-20" />
    </div>
  );
}
