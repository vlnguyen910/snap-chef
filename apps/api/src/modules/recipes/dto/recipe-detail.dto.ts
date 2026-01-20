import { Recipe, Step, Ingredient, User } from 'src/generated/prisma/client';

export type RecipeDetail = Pick<
  Recipe,
  | 'id'
  | 'author_id' // Explicitly selected in findOne
  | 'title'
  | 'thumbnail_url'
  | 'cooking_time'
  | 'servings'
  | 'created_at'
> & {
  user: Pick<User, 'username' | 'avatar_url'>;
  ingredients: {
    quantity: number;
    unit: string;
    ingredient: Pick<Ingredient, 'name'>;
  }[];
  steps: Pick<Step, 'order_index' | 'image_url' | 'content'>[];
  comments_count: number;
  likes_count: number;
  is_liked: boolean;
};
