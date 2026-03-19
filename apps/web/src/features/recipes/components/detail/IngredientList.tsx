import { Dispatch, SetStateAction } from 'react';
import type { IngredientDisplay } from '../../types/recipe-detail';

interface IngredientListProps {
  ingredients: IngredientDisplay[];
  checkedIngredients: Set<number>;
  setCheckedIngredients: Dispatch<SetStateAction<Set<number>>>;
}

export function IngredientList({ ingredients, checkedIngredients, setCheckedIngredients }: IngredientListProps) {
  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev => {
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
    <div className="sticky top-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="w-1 h-8 bg-orange-500 rounded-full" />
        Ingredients
      </h2>
      
      {ingredients.length > 0 ? (
        <div className="bg-orange-50 rounded-xl p-6 space-y-3">
          {ingredients.map((ingredient) => (
            <label
              key={ingredient.index}
              className="flex items-start gap-3 cursor-pointer group hover:bg-orange-100 p-2 rounded-lg transition-colors"
            >
              <input
                type="checkbox"
                checked={checkedIngredients.has(ingredient.index)}
                onChange={() => toggleIngredient(ingredient.index)}
                className="mt-1 w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500 focus:ring-2 cursor-pointer"
              />
              <span className={`flex-1 text-gray-700 ${checkedIngredients.has(ingredient.index) ? 'line-through text-gray-400' : ''}`}>
                <span className="font-semibold">{ingredient.amount} {ingredient.unit}</span> {ingredient.name}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic">No ingredients listed for this recipe.</p>
      )}
    </div>
  );
}
