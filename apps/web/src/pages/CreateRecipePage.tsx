import { FormProvider, useForm, useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Camera, Menu, MoreHorizontal, ChefHat } from 'lucide-react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadToCloudinary } from '@/services/cloudinaryService';
import { recipeService } from '@/services/recipeService';
import { useStore } from '@/lib/store';
import { toast } from '@/lib/toast-store';

// --- TYPES ---
type Ingredient = {
  name: string;
  amount: number; // ✅ Đổi sang number để khớp với API (double)
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
  ingredients: Ingredient[];
  steps: Step[];
};

// --- SUB-COMPONENTS ---

// Image Uploader Section (Left Top)
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
            Bạn đã đăng hình món mình nấu ở đây chưa?
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

// General Info Section (Right Top)
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
    </div>
  );
};

// Ingredients Section (Left Bottom)
const IngredientsSection = () => {
  const { control, register, formState: { errors } } = useFormContext<RecipeFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' });

  return (
    <div className="space-y-4">
      {/* Header */}
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

      {/* Ingredients List */}
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <Menu size={20} className="cursor-move text-gray-400" />
              <input
                {...register(`ingredients.${index}.name`)}
                placeholder="Rice (tên nguyên liệu)"
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

// Steps Section (Right Bottom)
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
      {/* Header */}
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

      {/* Steps List */}
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

            {/* Optional Image Upload */}
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
              <div className="ml-10">
                <img
                  src={stepImages[index]}
                  alt={`Step ${index + 1}`}
                  className="h-32 w-full rounded-lg object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        type="button"
        onClick={() => append({ order_index: fields.length + 1, content: '' })}
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
export default function CreateRecipePage() {
  const methods = useForm<RecipeFormData>({
    defaultValues: {
      title: '',
      description: '',
      cooking_time: 30,
      serving: 2,
      ingredients: [{ name: '', amount: 0, unit: '' }],
      steps: [{ order_index: 1, content: '' }],
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [stepImagePreviews, setStepImagePreviews] = useState<Record<number, string>>({});
  const [stepFiles, setStepFiles] = useState<Record<number, File>>({});

  const navigate = useNavigate();
  const { user } = useStore();

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
    // ✅ DEBUGGING: Log raw form data at the very start
    console.log('🔍 ===== CREATE RECIPE SUBMISSION STARTED =====');
    console.log('📝 Raw Form Data:', data);
    console.log('👤 Current User:', user);
    console.log('🖼️ Thumbnail File:', thumbnailFile?.name || 'None');
    console.log('📸 Step Files:', Object.keys(stepFiles).map(idx => `Step ${idx}: ${stepFiles[Number(idx)]?.name}`));

    // Check authentication
    if (!user) {
      console.warn('⚠️ User not authenticated');
      toast.error('Vui lòng đăng nhập để tạo công thức');
      // ❌ DO NOT navigate automatically - let user stay on page
      return;
    }

    try {
      setIsLoading(true);

      // Step 1: Upload thumbnail image
      let thumbnailUrl = '';
      if (thumbnailFile) {
        console.log('📤 Uploading thumbnail to Cloudinary...');
        thumbnailUrl = await uploadToCloudinary(thumbnailFile);
        console.log('✅ Thumbnail uploaded successfully:', thumbnailUrl);
      } else {
        console.warn('⚠️ No thumbnail image selected');
      }

      // Step 2: Upload step images and transform to backend schema
      console.log('📤 Processing steps and uploading step images...');
      const stepsWithImages = await Promise.all(
        data.steps.map(async (step, index) => {
          let imageUrl = '';
          if (stepFiles[index]) {
            console.log(`📤 Uploading image for step ${index + 1}...`);
            imageUrl = await uploadToCloudinary(stepFiles[index]);
            console.log(`✅ Step ${index + 1} image uploaded:`, imageUrl);
          }
          
          // ✅ CRITICAL FIX: Only include image_url if it exists (not empty string)
          // Backend validator requires valid URL or field to be absent
          const stepData: {
            order_index: number;
            content: string;
            image_url?: string;
          } = {
            order_index: index + 1, // Backend requires Integer >= 1
            content: step.content.trim(),
          };

          // Only add image_url if it's not empty
          if (imageUrl && imageUrl.trim() !== '') {
            stepData.image_url = imageUrl;
          }

          return stepData;
        })
      );
      console.log('✅ Steps processed:', stepsWithImages.length);
      console.log('✅ Steps with images:', stepsWithImages.filter(s => s.image_url).length);

      // Step 3: Transform ingredients to backend schema
      const validIngredients = data.ingredients.filter(
        (ing) => ing.name.trim() && ing.amount > 0
      );
      console.log(`🥕 Valid ingredients: ${validIngredients.length} out of ${data.ingredients.length}`);

      // ✅ CRITICAL FIX: Backend expects 'quanity' (typo - missing 't')
      const ingredientsData = validIngredients.map((ing) => ({
        name: ing.name.trim(),
        quanity: parseFloat(String(ing.amount)) || 1, // Backend key is 'quanity' (typo), Number >= 1
        unit: ing.unit.trim(),
      }));

      // Step 4: Build final payload with STRICT backend schema mapping
      // ✅ Based on actual 400 error analysis
      const payload = {
        title: data.title.trim(),
        description: data.description.trim(),
        cooking_time: parseFloat(String(data.cooking_time)) || 0, // Number
        servings: parseInt(String(data.serving), 10) || 1, // MUST be 'servings' (plural), Integer >= 1
        thumbnail_url: thumbnailUrl, // snake_case
        ingredients: ingredientsData,
        steps: stepsWithImages,
      };

      // ✅ CRITICAL DEBUGGING: Log Final Payload for API
      console.log('🔍 ===== FINAL PAYLOAD FOR API =====');
      console.log('Final Payload for API:', JSON.stringify(payload, null, 2));
      console.log('🔍 Data Types Verification:');
      console.log('  - title:', typeof payload.title, `(${payload.title.length} chars)`);
      console.log('  - cooking_time:', typeof payload.cooking_time, `(value: ${payload.cooking_time})`);
      console.log('  - servings (PLURAL):', typeof payload.servings, `(value: ${payload.servings})`);
      console.log('  - ingredients count:', payload.ingredients.length);
      if (payload.ingredients.length > 0) {
        console.log('  - First ingredient quanity type:', typeof payload.ingredients[0].quanity);
      }
      console.log('  - steps count:', payload.steps.length);
      if (payload.steps.length > 0) {
        console.log('  - First step order_index:', payload.steps[0].order_index, '(MUST be >= 1)');
      }
      console.log('  - thumbnail_url:', payload.thumbnail_url ? 'Present' : 'Missing');
      console.log('====================================');

      // Step 5: Send to backend API
      console.log('🚀 Sending POST request to Render backend...');
      const response = await recipeService.createRecipe(payload);
      console.log('✅ ===== RECIPE CREATED SUCCESSFULLY =====');
      console.log('📦 Response:', response);

      // Clear form only after success
      methods.reset();
      setThumbnailPreview('');
      setThumbnailFile(null);
      setStepImagePreviews({});
      setStepFiles({});
      console.log('🧹 Form cleared');

      // ✅ CRITICAL: Show success toast - ONLY navigate when user clicks OK
      toast.success(
        'Công thức đã được đăng thành công!',
        {
          label: 'OK',
          onClick: () => {
            console.log('✅ User clicked OK, navigating to homepage...');
            navigate('/');
          },
        },
        Infinity // ⏳ Toast stays forever until user clicks OK
      );
      console.log('✅ Success toast displayed. Console logs preserved - NO automatic navigation.');

    } catch (error: any) {
      // ✅ COMPREHENSIVE ERROR LOGGING
      console.error('❌ ===== ERROR CREATING RECIPE =====');
      console.error('📛 Error Object:', error);
      console.error('📛 Error Message:', error?.message);
      console.error('📛 Error Response:', error?.response);
      console.error('📛 Response Status:', error?.response?.status);
      console.error('📛 Response Data:', error?.response?.data);
      console.error('📛 Response Headers:', error?.response?.headers);
      console.error('📛 Full Error Stack:', error?.stack);
      
      // ✅ CRITICAL: Log validation errors specifically
      if (error?.response?.data?.message) {
        console.error('🔴 Validation Errors:', error.response.data.message);
        if (Array.isArray(error.response.data.message)) {
          console.error('🔴 Individual Validation Errors:');
          error.response.data.message.forEach((err: any, idx: number) => {
            console.error(`  ${idx + 1}. ${JSON.stringify(err)}`);
          });
        }
      }
      console.error('====================================');
      
      // Extract detailed error message from backend
      let errorMessage = 'Không thể tạo công thức. Vui lòng thử lại.';
      
      if (error?.response?.status === 400 && error?.response?.data) {
        // 400 Bad Request - Validation Error
        const validationErrors = error.response.data.message;
        if (Array.isArray(validationErrors)) {
          // Multiple validation errors
          errorMessage = `Lỗi validation (${validationErrors.length}): ${validationErrors.join(', ')}`;
        } else {
          errorMessage = error.response.data.message || error.response.data.error || 'Validation failed';
        }
      } else if (error?.response?.data) {
        // Other backend errors
        const backendError = error.response.data;
        errorMessage = backendError.message || backendError.error || JSON.stringify(backendError);
        console.error('🔍 Backend Error Details:', backendError);
      } else if (error?.message?.includes('timeout')) {
        // Timeout error
        errorMessage = 'Server không phản hồi (timeout). Vui lòng thử lại sau.';
      } else if (error?.message) {
        // Network or other error
        errorMessage = error.message;
      }
      
      // ✅ Show error toast - DO NOT navigate, let user see the error
      toast.error(`Lỗi: ${errorMessage}`);
      console.log('❌ Error toast displayed. User stays on page to review errors.');

    } finally {
      setIsLoading(false);
      console.log('🏁 Submit process completed. Loading state reset.');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="min-h-screen bg-white py-8">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Top Section: 2 Columns */}
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            {/* Left: Image Uploader */}
            <ImageUploaderSection 
              thumbnailPreview={thumbnailPreview}
              onImageSelect={handleThumbnailImageSelect}
            />

            {/* Right: General Info */}
            <GeneralInfoSection />
          </div>

          {/* Bottom Section: 2 Columns */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Ingredients */}
            <IngredientsSection />

            {/* Right: Steps */}
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
              onClick={() => navigate(-1)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              className="bg-orange-600 px-8 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              <ChefHat size={18} className="mr-2" /> 
              {isLoading ? 'Đang đăng...' : 'Đăng công thức'}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}