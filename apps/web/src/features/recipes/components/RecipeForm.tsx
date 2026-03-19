import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ChefHat } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RecipeFormData } from "../types/recipe-form";
import { ImageUpload } from "./ImageUpload";
import { GeneralInfo } from "./GeneralInfo";
import { IngredientInput } from "./IngredientInput";
import { StepEditor } from "./StepEditor";

export interface RecipeFormProps {
  defaultValues?: Partial<RecipeFormData>;
  onSubmit: (
    data: RecipeFormData,
    thumbnailFile: File | null,
    stepFiles: Record<number, File>,
    stepImagePreviews: Record<number, string>,
  ) => Promise<void>;
  isLoading: boolean;
  submitText?: string;
  initialThumbnailPreview?: string;
  initialStepImagePreviews?: Record<number, string>;
}

export const RecipeForm = ({
  defaultValues,
  onSubmit,
  isLoading,
  submitText = "Đăng công thức",
  initialThumbnailPreview = "",
  initialStepImagePreviews = {},
  header,
}: RecipeFormProps & { header?: React.ReactNode }) => {
  const methods = useForm<RecipeFormData>({
    defaultValues: {
      title: "",
      description: "",
      cooking_time: 30,
      serving: 2,
      is_private: false,
      ingredients: [{ name: "", amount: 0, unit: "" }],
      steps: [{ order_index: 1, content: "" }],
      ...defaultValues,
    },
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string>(
    initialThumbnailPreview,
  );
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [stepImagePreviews, setStepImagePreviews] = useState<
    Record<number, string>
  >(initialStepImagePreviews);
  const [stepFiles, setStepFiles] = useState<Record<number, File>>({});
  const navigate = useNavigate();

  const handleThumbnailImageSelect = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);
    setThumbnailFile(file);
  };

  const handleStepImageSelect = (index: number, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setStepImagePreviews((prev) => ({ ...prev, [index]: previewUrl }));
    setStepFiles((prev) => ({ ...prev, [index]: file }));
  };

  const handleSubmit = async (data: RecipeFormData) => {
    await onSubmit(data, thumbnailFile, stepFiles, stepImagePreviews);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleSubmit)}
        className="min-h-screen bg-white py-8"
      >
        <div className="container mx-auto max-w-7xl px-4">
          {header}
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <ImageUpload
              thumbnailPreview={thumbnailPreview}
              onImageSelect={handleThumbnailImageSelect}
            />
            <GeneralInfo />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <IngredientInput />
            <StepEditor
              stepImages={stepImagePreviews}
              onImageSelect={handleStepImageSelect}
            />
          </div>

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
              {isLoading ? "Đang xử lý..." : submitText}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
