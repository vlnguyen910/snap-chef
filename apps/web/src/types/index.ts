// Global type definitions
export type UserRole = 'guest' | 'user' | 'moderator';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  authorId: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  cuisine?: string;
  prepTime: number;
  cookTime: number;
  cookingTime: number; // Alias for cookTime
  servings: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  ingredients: Ingredient[];
  instructions: Instruction[];
  tags?: string[];
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'approved';
  featured?: boolean;
  averageRating?: number;
  rating: number;
  ratingsCount?: number;
  reviewCount: number;
  favoriteCount: number;
  forkCount: number;
  forksCount?: number; // Alias for forkCount
  originalRecipeId?: string; // If forked from another recipe
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  notes?: string;
}

export interface Instruction {
  step: number;
  instruction: string;
}

export interface RecipeFork {
  id: string;
  originalRecipeId: string;
  forkedRecipeId: string;
  userId: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  recipeId: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  userId: string;
  recipeId: string;
  rating: number;
  review?: string;
  createdAt: string;
}

// Comment types
export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  user?: {
    id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  rating: number; // 0-5 stars
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentPayload {
  content: string;
  rating: number; // Must be 0-5
}

export interface UpdateCommentPayload {
  content?: string;
  rating?: number;
}

export interface ModerationQueue {
  id: string;
  recipeId: string;
  recipe: Recipe;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  moderatorNote?: string;
  moderatedBy?: string;
  moderatedAt?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SigninResponse {
  user: User;
  token: string;
}

// Auth types
export interface SigninCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
