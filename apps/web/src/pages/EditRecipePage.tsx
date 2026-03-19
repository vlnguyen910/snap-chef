import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { uploadToCloudinary } from "@/services/cloudinaryService";
import { api } from "@/lib/axios";
import { useStore } from "@/lib/store";
import { toast } from "@/lib/toast-store";
import Loading from "@/components/common/Loading";
import ErrorState from "@/components/common/ErrorState";
import { RecipeForm } from "@/features/recipes/components/RecipeForm";
import type { RecipeFormData } from "@/features/recipes/types/recipe-form";

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [initialData, setInitialData] = useState<Partial<RecipeFormData>>({});
  const [initialThumbnail, setInitialThumbnail] = useState("");
  const [initialStepImages, setInitialStepImages] = useState<
    Record<number, string>
  >({});

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
      const response = await api.get<any>(`/recipes/${id}`);

      const formData: RecipeFormData = {
        title: response.title || "",
        description: response.description || "",
        cooking_time: response.cooking_time || response.cookingTime || 30,
        serving: response.servings || response.serving || 2,
        is_private: response.is_private || false,
        thumbnailUrl: response.thumbnail_url || "",
        ingredients: response.ingredients?.map((ing: any) => ({
          name: ing.name || "",
          amount: ing.quantity || ing.quanity || ing.amount || 0,
          unit: ing.unit || "",
        })) || [{ name: "", amount: 0, unit: "" }],
        steps: response.steps
          ?.map((step: any, index: number) => ({
            order_index: step.order_index || step.order || index + 1,
            content: step.content || step.instruction || "",
          }))
          .sort((a: any, b: any) => a.order_index - b.order_index) || [
          { order_index: 1, content: "" },
        ],
      };

      setInitialData(formData);

      if (response.thumbnail_url) {
        setInitialThumbnail(response.thumbnail_url);
      }

      const stepPreviews: Record<number, string> = {};
      response.steps
        ?.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
        .forEach((step: any, index: number) => {
          const url = step.image_url || step.imageUrl;
          if (url) {
            stepPreviews[index] = url;
          }
        });
      setInitialStepImages(stepPreviews);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to load recipe",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (
    data: RecipeFormData,
    thumbnailFile: File | null,
    stepFiles: Record<number, File>,
    stepImagePreviews: Record<number, string>,
  ) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để chỉnh sửa công thức");
      return;
    }
    if (!id) {
      toast.error("Recipe ID is missing");
      return;
    }

    try {
      setIsSaving(true);

      let thumbnailUrl = initialThumbnail;
      if (thumbnailFile) {
        thumbnailUrl = await uploadToCloudinary(thumbnailFile);
      }

      const stepsWithImages = await Promise.all(
        data.steps.map(async (step, index) => {
          let imageUrl = stepImagePreviews[index] || "";

          if (stepFiles[index]) {
            imageUrl = await uploadToCloudinary(stepFiles[index]);
          }

          const stepData: any = {
            order_index: index + 1,
            content: step.content.trim(),
          };

          if (imageUrl && imageUrl.trim() !== "") {
            stepData.image_url = imageUrl;
          }

          return stepData;
        }),
      );

      const validIngredients = data.ingredients.filter(
        (ing) => ing.name.trim() && ing.amount > 0,
      );

      const ingredientsData = validIngredients.map((ing) => ({
        name: ing.name.trim(),
        quantity: parseFloat(String(ing.amount)) || 1,
        unit: ing.unit.trim(),
      }));

      const payload = {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        cooking_time: parseFloat(String(data.cooking_time)) || 0,
        serving: parseInt(String(data.serving), 10) || 1,
        is_private: Boolean(data.is_private),
        thumbnail_url: thumbnailUrl,
        ingredients: ingredientsData,
        steps: stepsWithImages,
      };

      await api.patch(`/recipes/${id}`, payload);

      toast.success(
        "Công thức đã được cập nhật!",
        {
          label: "Xem",
          onClick: () => navigate(`/recipes/${id}`),
        },
        5000,
      );
    } catch (error: any) {
      let errorMessage = "Không thể cập nhật công thức. Vui lòng thử lại.";

      if (error?.response?.status === 400 && error?.response?.data) {
        const validationErrors = error.response.data.message;
        if (Array.isArray(validationErrors)) {
          errorMessage = `Lỗi validation (${validationErrors.length}): ${validationErrors.join(", ")}`;
        } else {
          errorMessage = error.response.data.message || "Validation failed";
        }
      } else if (error?.response?.data) {
        errorMessage =
          error.response.data.message ||
          error.response.data.error ||
          JSON.stringify(error.response.data);
      } else if (error?.message?.includes("timeout")) {
        errorMessage = "Server không phản hồi (timeout). Vui lòng thử lại sau.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(`Lỗi: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading fullScreen />;
  if (error)
    return <ErrorState message={error} onRetry={fetchRecipe} fullScreen />;

  const header = (
    <div className="mb-6">
      <Link
        to={`/recipes/${id}`}
        className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors font-medium mb-4"
      >
        <ArrowLeft size={20} />
        Quay lại
      </Link>
      <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa công thức</h1>
    </div>
  );

  return (
    <RecipeForm
      defaultValues={initialData}
      onSubmit={onSubmit}
      isLoading={isSaving}
      submitText="Lưu thay đổi"
      initialThumbnailPreview={initialThumbnail}
      initialStepImagePreviews={initialStepImages}
      header={header}
    />
  );
}
