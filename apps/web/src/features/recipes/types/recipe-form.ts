export type IngredientForm = {
  name: string;
  amount: number;
  unit: string;
};

export type StepForm = {
  order_index: number;
  content: string;
};

export type RecipeFormData = {
  title: string;
  description?: string;
  cooking_time: number;
  serving: number;
  is_private: boolean;
  thumbnailUrl: string;
  ingredients: IngredientForm[];
  steps: StepForm[];
};
