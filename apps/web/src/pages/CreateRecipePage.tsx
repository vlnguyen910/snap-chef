import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadToCloudinary } from '@/services/cloudinaryService';
import { recipeService } from '@/services/recipeService';
import { useStore } from '@/lib/store';
import { toast } from '@/lib/toast-store';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { RecipeForm } from '@/features/recipes/components/RecipeForm';
import type { RecipeFormData } from '@/features/recipes/types/recipe-form';

export default function CreateRecipePage() {
  useDocumentTitle('Create Recipe');
  const navigate = useNavigate();
  const { user } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (
    data: RecipeFormData,
    thumbnailFile: File | null,
    stepFiles: Record<number, File>
  ) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để tạo công thức');
      return;
    }

    try {
      setIsLoading(true);
      let thumbnailUrl = '';
      if (thumbnailFile) {
        thumbnailUrl = await uploadToCloudinary(thumbnailFile);
      }

      const stepsWithImages = await Promise.all(
        data.steps.map(async (step, index) => {
          let imageUrl = '';
          if (stepFiles[index]) {
            imageUrl = await uploadToCloudinary(stepFiles[index]);
          }
          
          const stepData: any = {
            order_index: index + 1,
            content: step.content.trim(),
          };

          if (imageUrl && imageUrl.trim() !== '') {
            stepData.image_url = imageUrl;
          }
          return stepData;
        })
      );

      const validIngredients = data.ingredients.filter(
        (ing) => ing.name.trim() && ing.amount > 0
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
        servings: parseInt(String(data.serving), 10) || 1,
        thumbnail_url: thumbnailUrl,
        ingredients: ingredientsData,
        steps: stepsWithImages,
      };

      await recipeService.createRecipe(payload);

      toast.success(
        'Công thức đã được đăng thành công!',
        {
          label: 'OK',
          onClick: () => navigate('/'),
        },
        Infinity
      );

    } catch (error: any) {
      let errorMessage = 'Không thể tạo công thức. Vui lòng thử lại.';
      
      if (error?.response?.status === 400 && error?.response?.data) {
        const validationErrors = error.response.data.message;
        if (Array.isArray(validationErrors)) {
          errorMessage = `Lỗi validation (${validationErrors.length}): ${validationErrors.join(', ')}`;
        } else {
          errorMessage = error.response.data.message || error.response.data.error || 'Validation failed';
        }
      } else if (error?.response?.data) {
        const backendError = error.response.data;
        errorMessage = backendError.message || backendError.error || JSON.stringify(backendError);
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Server không phản hồi (timeout). Vui lòng thử lại sau.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Lỗi: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RecipeForm 
      onSubmit={onSubmit} 
      isLoading={isLoading} 
      submitText="Đăng công thức" 
    />
  );
}