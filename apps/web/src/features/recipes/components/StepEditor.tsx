import { useFieldArray, useFormContext } from "react-hook-form";
import { Camera, Menu, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecipeFormData } from "../types/recipe-form";

export const StepEditor = ({
  stepImages,
  onImageSelect,
}: {
  stepImages: Record<number, string>;
  onImageSelect: (index: number, file: File) => void;
}) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RecipeFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: "steps" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Các bước</h2>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Thời gian nấu:</label>
            <input
              type="number"
              {...register("cooking_time", {
                min: {
                  value: 1,
                  message: "Thời gian nấu không thể âm hoặc bằng 0",
                },
                valueAsNumber: true,
              })}
              className="w-20 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1 text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-600">phút</span>
          </div>
          {errors.cooking_time && (
            <p className="text-xs text-red-500">
              {errors.cooking_time.message}
            </p>
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
                    e.target.value = "";
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
              <div className="ml-10 relative group inline-block">
                <img
                  src={stepImages[index]}
                  alt={`Step ${index + 1}`}
                  className="h-32 w-full max-w-[200px] rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    const changeEvent = new Event("change", { bubbles: true });
                    const inputElement = document.getElementById(
                      `step-img-${index}`,
                    ) as HTMLInputElement;
                    if (inputElement) {
                      inputElement.value = "";
                      inputElement.dispatchEvent(changeEvent);
                    }
                  }}
                  className="absolute top-2 right-2 bg-white/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={16} className="text-gray-600" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        type="button"
        onClick={() => append({ order_index: fields.length + 1, content: "" })}
        variant="ghost"
        size="sm"
        className="text-orange-600 hover:text-orange-700"
      >
        + Thêm bước
      </Button>
    </div>
  );
};
