export interface IngredientFromAPI {
  id: number;
  name: string;
}

export interface RecipeIngredient {
  ingredient_id: number;
  quantity: number;
  unit: string;
  ingredient?: IngredientFromAPI;
}

export interface IngredientDisplay {
  name: string; 
  quantity: number;
  unit: string;
  index: number;
}

export interface StepFromAPI {
  order_index: number;
  content: string;
  image_url?: string;
}

export interface RecipeData {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  servings: number;
  cooking_time: number;
  thumbnail_url: string;
  status: string;
  ingredients: RecipeIngredient[];
  steps: StepFromAPI[];
  created_at: string;
  updated_at: string;
}

export interface AuthorData {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}
