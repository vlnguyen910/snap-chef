import { Dispatch, SetStateAction } from "react";
import type { IngredientDisplay } from "../../types/recipe-detail";

interface IngredientListProps {
  ingredients: IngredientDisplay[];
  checkedIngredients: Set<number>;
  setCheckedIngredients: Dispatch<SetStateAction<Set<number>>>;
}

export function IngredientList({
  ingredients,
  checkedIngredients,
  setCheckedIngredients,
}: IngredientListProps) {
  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-card p-6 dark:border-slate-800">
      <h2 className="border-b border-slate-200 pb-2 text-xl font-bold text-slate-900 dark:border-slate-800 dark:text-white">
        Ingredients
      </h2>

      {ingredients.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3">
          {ingredients.map((ingredient) => (
            <label
              key={ingredient.index}
              className="group flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-primary/5"
            >
              <input
                type="checkbox"
                checked={checkedIngredients.has(ingredient.index)}
                onChange={() => toggleIngredient(ingredient.index)}
                className="mt-0.5 h-5 w-5 cursor-pointer rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary"
              />
              <span
                className={`flex-1 text-slate-700 transition-colors group-hover:text-primary dark:text-slate-300 ${checkedIngredients.has(ingredient.index) ? "text-slate-400 line-through" : ""}`}
              >
                <span className="font-semibold">
                  {ingredient.quantity} {ingredient.unit}
                </span>{" "}
                {ingredient.name}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="mt-4 italic text-slate-500">
          No ingredients listed for this recipe.
        </p>
      )}
    </div>
  );
}
