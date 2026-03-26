import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Mail, Timer } from "lucide-react";
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
} from "@/features/recipes/types/recipe-detail";
import { RecipeHeader } from "@/features/recipes/components/detail/RecipeHeader";
import { RecipeActions } from "@/features/recipes/components/detail/RecipeActions";
import { IngredientList } from "@/features/recipes/components/detail/IngredientList";
import { StepList } from "@/features/recipes/components/detail/StepList";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const getAuthRedirectPath = () => {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return `/auth/signin?redirect=${redirect}`;
  };

  const goToSignin = () => {
    navigate(getAuthRedirectPath());
  };

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

      const normalizedRecipe = {
        ...recipeResponse,
        description: recipeResponse.description ?? null,
        status: recipeResponse.status ?? "published",
        updated_at: recipeResponse.updated_at ?? recipeResponse.created_at,
      };

      setRecipe(normalizedRecipe);

      if (authorResponse) {
        setAuthor(authorResponse);
      } else if (recipeResponse.user?.username) {
        setAuthor({
          id: recipeResponse.author_id,
          username: recipeResponse.user.username,
        });
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
      goToSignin();
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
      const nextIsLiked = Boolean(response.is_liked);
      const reconciledLikeCount = nextIsLiked
        ? previousIsLiked
          ? previousLikeCount
          : previousLikeCount + 1
        : previousIsLiked
          ? Math.max(previousLikeCount - 1, 0)
          : previousLikeCount;

      setIsLiked(nextIsLiked);
      setLikeCount(reconciledLikeCount);
      toast.success(nextIsLiked ? "❤️ Liked!" : "Unliked");
    } catch (error: any) {
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);

      if (error.response?.status === 401) {
        toast.error("Please login to like recipes");
        goToSignin();
      } else if (error.response?.status === 403) {
        toast.error("You cannot like your own recipe!");
      } else {
        toast.error("Failed to update like status");
      }
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleAddToCollection = () => {
    if (!user) {
      toast.warning("Please login to add recipes to collections");
      goToSignin();
      return;
    }

    toast.info("Add to collection sẽ nối API trong phiên bản tới.");
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: recipe?.title || "SnapChef Recipe",
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Unable to share this recipe right now");
    }
  };

  const handleFollowAuthor = async () => {
    if (!recipe?.author_id) return;
    if (!user) {
      toast.warning("Please login to follow users");
      goToSignin();
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
      const response = await api.post<{ message?: string }>(
        `/users/${recipe.author_id}/follow`,
      );

      const message = response?.message || "";
      const backendFollowing = message.includes("unfollowed")
        ? false
        : message.includes("followed")
          ? true
          : newIsFollowing;

      setIsFollowing(backendFollowing);
      toast.success(backendFollowing ? "✅ Following!" : "Unfollowed");
    } catch (error: any) {
      setIsFollowing(previousIsFollowing);
      if (error.response?.status === 401) {
        toast.error("Please login to follow users");
        goToSignin();
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
    if (recipe?.user?.username) {
      return recipe.user.username;
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
      const quantity = item.quantity || item.quanity || item.amount || 0;
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
      return { name, quantity, unit, index };
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

  const relatedCards = useMemo(() => {
    const baseImage =
      recipe?.thumbnail_url ||
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80&auto=format&fit=crop";

    return [
      {
        title: "Chef's Quick Variation",
        time: Math.max(getCookingTime() - 10, 10),
        image: steps[0]?.image_url || baseImage,
      },
      {
        title: "Flavor Booster Side",
        time: Math.max(Math.floor(getCookingTime() / 2), 10),
        image: steps[1]?.image_url || baseImage,
      },
      {
        title: "Fresh Serving Pair",
        time: Math.max(Math.floor(getCookingTime() / 3), 8),
        image: steps[2]?.image_url || baseImage,
      },
    ];
  }, [recipe?.thumbnail_url, steps, getCookingTime]);

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
    <div className="min-h-screen bg-background-light text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-4 py-6 md:flex-row md:px-8">
        <section className="flex min-w-0 flex-1 flex-col gap-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <RecipeHeader
            recipe={recipe}
            formatCookingTime={formatCookingTime}
            getServings={getServings}
            getCookingTime={getCookingTime}
            likeCount={likeCount}
            isLiked={isLiked}
          />

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
            handleAddToCollection={handleAddToCollection}
            handleShare={handleShare}
            handleDeleteRecipe={handleDeleteRecipe}
          />

          <section className="rounded-xl border border-slate-200 bg-card p-6 dark:border-slate-800">
            <h2 className="mb-3 text-xl font-bold">About this recipe</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {recipe.description || "No description available for this recipe."}
            </p>
            <p className="mt-3 text-xs font-medium text-slate-500">
              Created on {formatDate(recipe.created_at)}
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <IngredientList
                ingredients={ingredients}
                checkedIngredients={checkedIngredients}
                setCheckedIngredients={setCheckedIngredients}
              />
            </div>

            <div className="lg:col-span-2">
              <StepList steps={steps} />
            </div>
          </div>

          <RecipeComments recipeOwnerId={recipe?.author_id} />
        </section>

        <aside className="w-full space-y-6 md:w-80">
          <div>
            <h3 className="text-xl font-bold">Related Recipes</h3>
            <p className="text-sm font-medium text-primary">
              More inspiration from {getAuthorName()}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {relatedCards.map((card) => (
              <article
                key={card.title}
                className="group cursor-pointer rounded-xl border border-slate-200 bg-card p-3 shadow-sm transition-all hover:border-primary/50 dark:border-slate-800"
              >
                <div className="aspect-video overflow-hidden rounded-lg">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="mt-3">
                  <p className="font-bold transition-colors group-hover:text-primary">
                    {card.title}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                    <Timer className="size-3.5" /> {card.time} mins
                  </p>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
