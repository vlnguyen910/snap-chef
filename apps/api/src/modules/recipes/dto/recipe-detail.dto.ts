import { Recipe, Step, Ingredient, User } from 'src/generated/prisma/client';

export type RecipeDetail = Recipe & {
  user: Pick<User, 'username' | 'email' | 'avatar_url' | 'role'>;
  ingredients: {
    quantity: number;
    unit: string;
    ingredient: Ingredient;
  }[];
  steps: Step[];
  comments_count: number;
  likes_count: number;
  is_liked: boolean;
};
