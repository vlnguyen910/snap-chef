import { useFieldArray, useFormContext } from "react-hook-form";
import { Menu, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecipeFormData } from "../types/recipe-form";

export const IngredientInput = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RecipeFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Nguyên Liệu</h2>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Khẩu phần:</label>
            <input
              type="number"
              {...register("serving", {
                min: {
                  value: 1,
                  message: "Số khẩu phần không thể âm hoặc bằng 0",
                },
                valueAsNumber: true,
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
                placeholder="Rice (tên nguyên liệu)"
                className="flex-1 rounded-lg border-none bg-gray-100 px-4 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="number"
                step="0.01"
                {...register(`ingredients.${index}.amount`, {
                  valueAsNumber: true,
                  min: { value: 0.01, message: "Số lượng không thể âm" },
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
        onClick={() => append({ name: "", amount: 0, unit: "" })}
        variant="ghost"
        size="sm"
        className="text-orange-600 hover:text-orange-700"
      >
        + Thêm nguyên liệu
      </Button>
    </div>
  );
};
