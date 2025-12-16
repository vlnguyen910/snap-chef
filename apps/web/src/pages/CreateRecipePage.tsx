import { FormProvider, useForm, useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChefHat, ImageIcon, Camera, X, Lock, Globe } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadToCloudinary } from '@/services/cloudinaryService';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';

// --- TYPES ---
type Ingredient = {
  name: string;
  amount: string;
  unit: string;
};

type Step = {
  order_index: number;
  content: string;
};

type RecipeFormData = {
  title: string;
  description: string;
  cooking_time: number;
  serving: number;
  thumbnailUrl: string;
  is_private: boolean;
  ingredients: Ingredient[];
  steps: Step[];
};

// --- SUB-COMPONENTS ---

const BasicInfoSection = () => {
  const { register, formState: { errors } } = useFormContext<RecipeFormData>();
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
      
      {/* Title */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Recipe Title <span className="text-red-500">*</span>
        </label>
        <input
          {...register('title', { required: 'Title is required' })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          placeholder="e.g., Spicy Thai Basil Chicken"
        />
        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={4}
          {...register('description', { required: 'Description is required' })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          placeholder="Describe your recipe..."
        />
        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
      </div>

      {/* Time & Servings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Cooking Time (min)</label>
          <input
            type="number"
            {...register('cooking_time', { min: 1, valueAsNumber: true })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Servings</label>
          <input
            type="number"
            {...register('serving', { min: 1, valueAsNumber: true })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
      </div>

      {/* Privacy Setting */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_private"
            {...register('is_private')}
            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-500"
          />
          <label htmlFor="is_private" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Lock size={16} />
            <span>Make this recipe private</span>
          </label>
        </div>
        <Globe size={16} className="text-gray-400" />
      </div>
    </div>
  );
};

const ThumbnailSection = ({ 
  thumbnailPreview, 
  onImageSelect, 
  onImageRemove 
}: { 
  thumbnailPreview: string,
  onImageSelect: (file: File) => void,
  onImageRemove: () => void
}) => {
  const { register, watch } = useFormContext<RecipeFormData>();
  const thumbnailUrl = watch('thumbnailUrl');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (thumbnailUrl && (thumbnailUrl.startsWith('http') || thumbnailUrl.startsWith('blob'))) {
      // If URL is provided, it might be a file preview
    }
  }, [thumbnailUrl]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Recipe Image</h2>
      
      {/* Toggle between URL input and File upload */}
      <div className="flex gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
        <label className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-white">
          <input type="radio" name="image-mode" defaultChecked className="hidden" />
          📤 Upload File
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-white">
          <input type="radio" name="image-mode" className="hidden" />
          🔗 URL
        </label>
      </div>

      {!thumbnailPreview ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            id="thumbnail-image"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImageSelect(file);
              }
              e.target.value = '';
            }}
          />
          <label
            htmlFor="thumbnail-image"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-8 text-gray-600 transition-all hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
          >
            <Camera size={32} className="text-orange-500" />
            <div className="text-center">
              <p className="font-medium">Click to upload or drag image here</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
            </div>
          </label>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-lg border border-gray-200">
          <img 
            src={thumbnailPreview} 
            alt="Recipe thumbnail" 
            className="h-64 w-full object-cover" 
          />
          <button
            type="button"
            onClick={onImageRemove}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600"
          >
            <X size={16} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-2 left-2 flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm text-white shadow-md hover:bg-orange-700"
          >
            <Camera size={16} />
            Change Image
          </button>
        </div>
      )}

      {/* Fallback: URL input */}
      <div className="pt-2 border-t border-gray-200">
        <label className="mb-2 block text-sm font-medium text-gray-700">Or paste image URL</label>
        <input
          {...register('thumbnailUrl')}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          placeholder="https://example.com/image.jpg"
        />
      </div>
    </div>
  );
};

const IngredientsSection = () => {
  const { control, register } = useFormContext<RecipeFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Ingredients</h2>
        <Button
          type="button"
          onClick={() => append({ name: '', amount: '', unit: '' })}
          size="sm"
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus size={16} className="mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-12 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <input
              {...register(`ingredients.${index}.name`)}
              placeholder="Name (e.g., Chicken breast)"
              className="col-span-5 rounded border border-gray-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none"
            />
            <input
              {...register(`ingredients.${index}.amount`)}
              placeholder="Amount (e.g., 2)"
              className="col-span-3 rounded border border-gray-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none"
            />
            <input
              {...register(`ingredients.${index}.unit`)}
              placeholder="Unit (e.g., cups)"
              className="col-span-3 rounded border border-gray-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
              className="col-span-1 flex items-center justify-center text-red-500 hover:text-red-700 disabled:opacity-30"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- FIX CHÍNH NẰM Ở ĐÂY: StepsSection ---
const StepsSection = ({ 
  stepImages, 
  onImageSelect, 
  onImageRemove 
}: { 
  stepImages: Record<number, string>, 
  onImageSelect: (index: number, file: File) => void,
  onImageRemove: (index: number) => void
}) => {
  const { control, register } = useFormContext<RecipeFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: 'steps' });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Cooking Steps</h2>
        <Button
          type="button"
          onClick={() => append({ order_index: fields.length + 1, content: '' })}
          size="sm"
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus size={16} className="mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                {index + 1}
              </div>
              <button
                type="button"
                onClick={() => {
                  remove(index);
                  onImageRemove(index); // Clean up image mapping
                }}
                disabled={fields.length === 1}
                className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <textarea
              {...register(`steps.${index}.content`)}
              placeholder="Describe this step..."
              rows={3}
              className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            />

            {/* Image Upload Area */}
            <div className="mt-3">
              {!stepImages[index] ? (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id={`step-image-${index}`} // Unique ID for label binding
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onImageSelect(index, file);
                      // Reset value để cho phép chọn lại cùng 1 file nếu cần
                      e.target.value = ''; 
                    }}
                  />
                  <label
                    htmlFor={`step-image-${index}`}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-600 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Camera size={20} className="text-orange-500" />
                    <span className="font-medium">Add Image</span>
                  </label>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={stepImages[index]}
                    alt={`Step ${index + 1}`}
                    className="h-40 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onImageRemove(index)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function CreateRecipePage() {
  const navigate = useNavigate();
  // State quản lý preview ảnh của Steps (Map theo index)
  const [stepImagePreviews, setStepImagePreviews] = useState<Record<number, string>>({});
  // Lưu trữ File object thật để gửi lên server
  const [stepFiles, setStepFiles] = useState<Record<number, File>>({});
  
  // State cho thumbnail
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<RecipeFormData>({
    defaultValues: {
      title: '',
      description: '',
      cooking_time: 30,
      serving: 4,
      is_private: false,
      ingredients: [{ name: '', amount: '', unit: '' }],
      steps: [{ order_index: 1, content: '' }],
    },
  });

  // Handle thumbnail image selection
  const handleThumbnailImageSelect = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);
    setThumbnailFile(file);
  };

  // Handle thumbnail image removal
  const handleThumbnailImageRemove = () => {
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailPreview('');
    setThumbnailFile(null);
  };

  const handleStepImageSelect = (index: number, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setStepImagePreviews(prev => ({ ...prev, [index]: previewUrl }));
    setStepFiles(prev => ({ ...prev, [index]: file }));
  };

  const handleStepImageRemove = (index: number) => {
    // Revoke URL cũ để tránh memory leak
    if (stepImagePreviews[index]) {
      URL.revokeObjectURL(stepImagePreviews[index]);
    }
    
    // Xóa preview và file
    setStepImagePreviews(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setStepFiles(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
  };

  const onSubmit = async (data: RecipeFormData) => {
    // Step 1: Validate inputs
    if (!data.title.trim()) {
      alert('Please enter a recipe title.');
      return;
    }

    if (!data.description.trim()) {
      alert('Please enter a recipe description.');
      return;
    }

    if (!thumbnailFile) {
      alert('Please upload a recipe image before submitting.');
      return;
    }

    const validIngredients = data.ingredients.filter(ing => ing.name.trim());
    if (validIngredients.length === 0) {
      alert('Please add at least one ingredient.');
      return;
    }

    const validSteps = data.steps.filter(step => step.content.trim());
    if (validSteps.length === 0) {
      alert('Please add at least one cooking step.');
      return;
    }

    // Get current user from Zustand store
    const user = useStore.getState().user;
    if (!user) {
      alert('You must be logged in to create a recipe.');
      navigate('/auth/login');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 2: Upload thumbnail to Cloudinary
      console.log('📤 Uploading thumbnail to Cloudinary...');
      const thumbnailUrl = await uploadToCloudinary(thumbnailFile);
      console.log('✅ Thumbnail uploaded:', thumbnailUrl);

      // Step 3: Upload step images to Cloudinary (if any)
      const stepsWithImages = await Promise.all(
        validSteps.map(async (step, index) => {
          let imageUrl = null;
          if (stepFiles[index]) {
            console.log(`📤 Uploading step ${index + 1} image...`);
            imageUrl = await uploadToCloudinary(stepFiles[index]);
            console.log(`✅ Step ${index + 1} image uploaded:`, imageUrl);
          }
          return {
            order_index: index + 1,
            content: step.content.trim(),
            image_url: imageUrl,
          };
        })
      );

      // Step 4: Prepare ingredients for JSONB
      const ingredientsData = validIngredients.map(ing => ({
        name: ing.name.trim(),
        amount: ing.amount.trim(),
        unit: ing.unit.trim(),
      }));

      // Step 5: Insert into Supabase
      console.log('📝 Inserting recipe into Supabase...');
      const { data: recipeData, error } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          title: data.title.trim(),
          description: data.description.trim(),
          cooking_time: data.cooking_time,
          serving: data.serving,
          is_private: data.is_private,
          thumbnail_url: thumbnailUrl,
          ingredients: ingredientsData, // JSONB field
          steps: stepsWithImages, // JSONB field
          status: 'pending', // Default to pending for moderation
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw new Error(error.message);
      }

      // Success handling
      console.log('✅ Recipe created successfully:', recipeData);
      alert('Recipe submitted successfully! It will be reviewed by our moderators.');
      
      // Clear form and navigate
      methods.reset();
      setThumbnailPreview('');
      setThumbnailFile(null);
      setStepImagePreviews({});
      setStepFiles({});
      navigate('/my-recipes');
    } catch (error) {
      // Error handling
      console.error('❌ Error creating recipe:', error);
      
      if (error instanceof Error) {
        alert(`Failed to publish recipe: ${error.message}`);
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-full bg-orange-100 p-3">
            <ChefHat className="text-orange-600" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Recipe</h1>
            <p className="mt-1 text-gray-600">Share your culinary masterpiece</p>
          </div>
        </div>

        {/* Main Form */}
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <BasicInfoSection />
                <ThumbnailSection 
                  thumbnailPreview={thumbnailPreview}
                  onImageSelect={handleThumbnailImageSelect}
                  onImageRemove={handleThumbnailImageRemove}
                />
              </div>
              <div className="space-y-6">
                <IngredientsSection />
                <StepsSection 
                  stepImages={stepImagePreviews}
                  onImageSelect={handleStepImageSelect}
                  onImageRemove={handleStepImageRemove}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-orange-600 px-8 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <ChefHat size={18} className="mr-2" /> 
                {isSubmitting ? 'Publishing...' : 'Publish Recipe'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}