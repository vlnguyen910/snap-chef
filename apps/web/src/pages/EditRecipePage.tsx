import { FormProvider, useForm, useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Camera, Menu, MoreHorizontal, Save, ArrowLeft } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { uploadToCloudinary } from '@/services/cloudinaryService';
import { api } from '@/lib/axios';
import { useStore } from '@/lib/store';
import { toast } from '@/lib/toast-store';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';

// --- TYPES ---
type Ingredient = {
  name: string;
  amount: number;
  unit: string;
};

type Step = {
  order_index: number;
  content: string;
  image_url?: string;
};

type RecipeFormData = {
  title: string;
  description: string;
  cooking_time: number;
  serving: number;
  is_private: boolean;
  thumbnailUrl: string;
  ingredients: Ingredient[];
  steps: Step[];
};

// --- SUB-COMPONENTS ---

// Image Uploader Section
const ImageUploaderSection = ({ 
  thumbnailPreview, 
  onImageSelect, 
}: { 
  thumbnailPreview: string,
  onImageSelect: (file: File) => void,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="h-full min-h-[500px] rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        id="main-thumbnail"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImageSelect(file);
          e.target.value = '';
        }}
      />
      {!thumbnailPreview ? (
        <label
          htmlFor="main-thumbnail"
          className="flex cursor-pointer flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <Camera size={64} className="text-gray-400" />
          <p className="text-lg text-gray-600">
            Thay đổi hình món ăn
          </p>
        </label>
      ) : (
        <div className="relative h-full w-full">
          <img 
            src={thumbnailPreview} 
            alt="Recipe" 
            className="h-full w-full rounded-lg object-cover" 
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-4 right-4 rounded-lg bg-white px-4 py-2 shadow-md hover:bg-gray-100"
          >
            <Camera size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

// General Info Section
const GeneralInfoSection = () => {
  const { register, formState: { errors } } = useFormContext<RecipeFormData>();
  const { user } = useStore();

  return (
    <div className="space-y-4">
      {/* Title */}
      <input
        {...register('title', { required: 'Title is required' })}
        className="w-full border-none bg-transparent text-3xl font-bold text-gray-900 placeholder-gray-400 focus:outline-none"
        placeholder="Nhập tên món"
      />
      {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}

      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
          {user?.firstName?.[0] || 'U'}
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {user?.firstName || 'User'} {user?.lastName || ''}
          </p>
          <p className="text-sm text-gray-500">@{user?.username || 'username'}</p>
        </div>
      </div>

      {/* Description */}
      <textarea
        {...register('description', { required: 'Description is required' })}
        rows={8}
        className="w-full rounded-lg border-none bg-gray-100 px-4 py-3 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        placeholder="Hãy mô tả cho mọi người về món này..."
      />
      {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}

      {/* Private Recipe Checkbox */}
      <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
        <input
          type="checkbox"
          {...register('is_private')}
          id="is_private"
          className="w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500 focus:ring-2 cursor-pointer"
        />
        <label htmlFor="is_private" className="cursor-pointer flex-1">
          <span className="font-medium text-gray-900">Công thức riêng tư</span>
          <p className="text-sm text-gray-600">Chỉ bạn có thể xem công thức này</p>
        </label>
      </div>
    </div>
  );
};

// Ingredients Section
const IngredientsSection = () => {
  const { control, register, formState: { errors } } = useFormContext<RecipeFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Nguyên Liệu</h2>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Khẩu phần:</label>
            <input
              type="number"
              {...register('serving', { 
                min: { value: 1, message: 'Số khẩu phần không thể âm hoặc bằng 0' },
                valueAsNumber: true 
              })}
              className="w-20 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1 text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          {errors.serving && (
            <p className="text-xs text-red-500">{errors.serving.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <Menu size={20} className="cursor-move text-gray-400" />
              <input
                {...register(`ingredients.${index}.name`)}
                placeholder="Tên nguyên liệu"
                className="flex-1 rounded-lg border-none bg-gray-100 px-4 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="number"
                step="0.01"
                {...register(`ingredients.${index}.amount`, { 
                  valueAsNumber: true,
                  min: { value: 0.01, message: 'Số lượng không thể âm' }
                })}
                placeholder="Số lượng"
                className="w-24 rounded-lg border-none bg-gray-100 px-3 py-2 text-center text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                {...register(`ingredients.${index}.unit`)}
                placeholder="Đơn vị"
                className="w-24 rounded-lg border-none bg-gray-100 px-3 py-2 text-center text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => fields.length > 1 && remove(index)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MoreHorizontal size={20} />
              </button>
            </div>
            {errors.ingredients?.[index]?.amount && (
              <p className="text-xs text-red-500 ml-6">
                {errors.ingredients[index]?.amount?.message}
              </p>
            )}
          </div>
        ))}
      </div>

      <Button
        type="button"
        onClick={() => append({ name: '', amount: 0, unit: '' })}
        variant="ghost"
        size="sm"
        className="text-orange-600 hover:text-orange-700"
      >
        + Thêm nguyên liệu
      </Button>
    </div>
  );
};

// Steps Section
const StepsSection = ({ 
  stepImages, 
  onImageSelect, 
}: { 
  stepImages: Record<number, string>, 
  onImageSelect: (index: number, file: File) => void,
}) => {
  const { control, register, formState: { errors } } = useFormContext<RecipeFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: 'steps' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Các bước</h2>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Thời gian nấu:</label>
            <input
              type="number"
              {...register('cooking_time', { 
                min: { value: 1, message: 'Thời gian nấu không thể âm hoặc bằng 0' },
                valueAsNumber: true 
              })}
              className="w-20 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1 text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-600">phút</span>
          </div>
          {errors.cooking_time && (
            <p className="text-xs text-red-500">{errors.cooking_time.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                {index + 1}
              </div>
              <Menu size={20} className="cursor-move text-gray-400 mt-2" />
              <textarea
                {...register(`steps.${index}.content`)}
                placeholder="Mô tả bước này..."
                rows={2}
                className="flex-1 rounded-lg border-none bg-gray-100 px-4 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => fields.length > 1 && remove(index)}
                className="text-gray-400 hover:text-gray-600 mt-2"
              >
                <MoreHorizontal size={20} />
              </button>
            </div>

            {!stepImages[index] ? (
              <div className="ml-10">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id={`step-img-${index}`}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImageSelect(index, file);
                    e.target.value = '';
                  }}
                />
                <label
                  htmlFor={`step-img-${index}`}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-500 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
                >
                  <Camera size={16} />
                  Thêm hình ảnh
                </label>
              </div>
            ) : (
              <div className="ml-10 relative">
                <img
                  src={stepImages[index]}
                  alt={`Step ${index + 1}`}
                  className="h-32 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById(`step-img-${index}`)?.click()}
                  className="absolute top-2 right-2 bg-white rounded-lg p-2 shadow-md hover:bg-gray-100"
                >
                  <Camera size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        type="button"
        onClick={() => append({ order_index: fields.length + 1, content: '', image_url: '' })}
        variant="ghost"
        size="sm"
        className="text-orange-600 hover:text-orange-700"
      >
        + Thêm bước
      </Button>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const methods = useForm<RecipeFormData>({
    defaultValues: {
      title: '',
      description: '',
      cooking_time: 30,
      serving: 2,
      is_private: false,
      ingredients: [{ name: '', amount: 0, unit: '' }],
      steps: [{ order_index: 1, content: '', image_url: '' }],
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [stepImagePreviews, setStepImagePreviews] = useState<Record<number, string>>({});
  const [stepFiles, setStepFiles] = useState<Record<number, File>>({});

  const navigate = useNavigate();
  const { user } = useStore();

  // Fetch recipe data and pre-fill form
  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    if (!id) {
      setError('Recipe ID is missing');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching recipe for editing:', id);
      const response = await api.get<any>(`/recipes/${id}`);
      console.log('✅ Recipe data fetched:', response);

      // ✅ MAP API RESPONSE (snake_case) to FORM VALUES (camelCase)
      const formData: RecipeFormData = {
        title: response.title || '',
        description: response.description || '',
        cooking_time: response.cooking_time || response.cookingTime || 30,
        serving: response.servings || response.serving || 2,
        is_private: response.is_private || false,
        thumbnailUrl: response.thumbnail_url || '',
        
        // Map ingredients: backend fields -> frontend 'amount'
        ingredients: response.ingredients?.map((ing: any) => ({
          name: ing.name || '',
          amount: ing.quantity || ing.quanity || ing.amount || 0,
          unit: ing.unit || '',
        })) || [{ name: '', amount: 0, unit: '' }],
        
        // Map steps: content -> content, order_index -> order_index
        steps: response.steps?.map((step: any, index: number) => ({
          order_index: step.order_index || step.order || index + 1,
          content: step.content || step.instruction || '',
          image_url: step.image_url || step.imageUrl || '',
        })).sort((a: any, b: any) => a.order_index - b.order_index) || [{ order_index: 1, content: '', image_url: '' }],
      };

      console.log('📝 Mapped form data:', formData);

      // Reset form with fetched data
      methods.reset(formData);

      // Set thumbnail preview
      if (response.thumbnail_url) {
        setThumbnailPreview(response.thumbnail_url);
      }

      // Set step image previews
      const stepPreviews: Record<number, string> = {};
      formData.steps.forEach((step, index) => {
        if (step.image_url) {
          stepPreviews[index] = step.image_url;
        }
      });
      setStepImagePreviews(stepPreviews);

    } catch (err: any) {
      console.error('❌ Error fetching recipe:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load recipe');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle thumbnail image selection
  const handleThumbnailImageSelect = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);
    setThumbnailFile(file);
  };

  // Handle step image selection
  const handleStepImageSelect = (index: number, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setStepImagePreviews(prev => ({ ...prev, [index]: previewUrl }));
    setStepFiles(prev => ({ ...prev, [index]: file }));
  };

  const onSubmit = async (data: RecipeFormData) => {
    console.log('🔍 ===== UPDATE RECIPE SUBMISSION STARTED =====');
    console.log('📝 Form Data:', data);

    if (!user) {
      toast.error('Vui lòng đăng nhập để chỉnh sửa công thức');
      return;
    }

    if (!id) {
      toast.error('Recipe ID is missing');
      return;
    }

    try {
      setIsSaving(true);

      // Step 1: Upload new thumbnail if changed
      let thumbnailUrl = thumbnailPreview;
      if (thumbnailFile) {
        console.log('📤 Uploading new thumbnail to Cloudinary...');
        thumbnailUrl = await uploadToCloudinary(thumbnailFile);
        console.log('✅ New thumbnail uploaded:', thumbnailUrl);
      }

      // Step 2: Upload new step images
      console.log('📤 Processing steps and uploading new step images...');
      const stepsWithImages = await Promise.all(
        data.steps.map(async (step, index) => {
          let imageUrl = stepImagePreviews[index] || step.image_url || '';
          
          // Upload new image if user selected one
          if (stepFiles[index]) {
            console.log(`📤 Uploading new image for step ${index + 1}...`);
            imageUrl = await uploadToCloudinary(stepFiles[index]);
            console.log(`✅ Step ${index + 1} image uploaded:`, imageUrl);
          }
          
          // ✅ BUILD STEP OBJECT (Backend expects 'order' and 'content')
          const stepData: any = {
            order_index: index + 1, // Backend expects 'order' (not order_index)
            content: step.content.trim(),
          };

          // Only include image_url if it exists
          if (imageUrl && imageUrl.trim() !== '') {
            stepData.image_url = imageUrl;
          }

          return stepData;
        })
      );

      // Step 3: Transform ingredients
      const validIngredients = data.ingredients.filter(
        (ing) => ing.name.trim() && ing.amount > 0
      );

      const ingredientsData = validIngredients.map((ing) => ({
        name: ing.name.trim(),
        quantity: parseFloat(String(ing.amount)) || 1, // Using correct 'quantity' spelling
        unit: ing.unit.trim(),
      }));

      // Step 4: Build UPDATE payload (Based on PUT /recipes/:id spec)
      const payload = {
        title: data.title.trim(),
        description: data.description.trim(),
        cooking_time: parseFloat(String(data.cooking_time)) || 0,
        serving: parseInt(String(data.serving), 10) || 1, // Note: 'serving' singular
        is_private: Boolean(data.is_private),
        thumbnail_url: thumbnailUrl,
        ingredients: ingredientsData,
        steps: stepsWithImages,
      };

      // ✅ DEBUGGING: Log update payload
      console.log('🔍 ===== UPDATE PAYLOAD =====');
      console.log('Update Payload:', JSON.stringify(payload, null, 2));
      console.log('🔍 Data Types:');
      console.log('  - cooking_time:', typeof payload.cooking_time);
      console.log('  - serving:', typeof payload.serving);
      console.log('  - is_private:', typeof payload.is_private);
      console.log('  - ingredients count:', payload.ingredients.length);
      console.log('  - steps count:', payload.steps.length);
      console.log('============================');

      // Step 5: Send PUT request to update recipe
      console.log(`🚀 Sending PUT request to /recipes/${id}...`);
      const response = await api.patch(`/recipes/${id}`, payload);
      console.log('✅ Recipe updated successfully:', response);

      // Clear temporary files
      setThumbnailFile(null);
      setStepFiles({});

      // Show success toast and navigate
      toast.success(
        'Công thức đã được cập nhật!',
        {
          label: 'Xem',
          onClick: () => {
            navigate(`/recipes/${id}`);
          },
        },
        5000
      );

      console.log('✅ Update completed successfully');

    } catch (error: any) {
      // ✅ COMPREHENSIVE ERROR LOGGING
      console.error('❌ ===== ERROR UPDATING RECIPE =====');
      console.error('📛 Error Object:', error);
      console.error('📛 Error Message:', error?.message);
      console.error('📛 Error Response:', error?.response);
      console.error('📛 Response Status:', error?.response?.status);
      console.error('📛 Response Data:', error?.response?.data);
      
      // ✅ Log validation errors explicitly
      if (error?.response?.status === 400 && error?.response?.data) {
        console.error('🔴 VALIDATION ERRORS:', error.response.data);
        const validationErrors = error.response.data.message;
        if (Array.isArray(validationErrors)) {
          console.error('🔴 Individual Validation Errors:');
          validationErrors.forEach((err: any, idx: number) => {
            console.error(`  ${idx + 1}. ${JSON.stringify(err)}`);
          });
        }
      }
      console.error('====================================');
      
      // Extract error message
      let errorMessage = 'Không thể cập nhật công thức. Vui lòng thử lại.';
      
      if (error?.response?.status === 400 && error?.response?.data) {
        const validationErrors = error.response.data.message;
        if (Array.isArray(validationErrors)) {
          errorMessage = `Lỗi validation (${validationErrors.length}): ${validationErrors.join(', ')}`;
        } else {
          errorMessage = error.response.data.message || 'Validation failed';
        }
      } else if (error?.response?.data) {
        errorMessage = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Server không phản hồi (timeout). Vui lòng thử lại sau.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Lỗi: ${errorMessage}`);

    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchRecipe} fullScreen />;

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="min-h-screen bg-white py-8">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Header with Back Button */}
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

          {/* Top Section: 2 Columns */}
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <ImageUploaderSection 
              thumbnailPreview={thumbnailPreview}
              onImageSelect={handleThumbnailImageSelect}
            />
            <GeneralInfoSection />
          </div>

          {/* Bottom Section: 2 Columns */}
          <div className="grid gap-6 lg:grid-cols-2">
            <IngredientsSection />
            <StepsSection 
              stepImages={stepImagePreviews}
              onImageSelect={handleStepImageSelect}
            />
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex items-center justify-end gap-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => navigate(`/recipes/${id}`)}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              className="bg-orange-600 px-8 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              <Save size={18} className="mr-2" /> 
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
