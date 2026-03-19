export interface UserProfileData {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  followers_count?: number;
  following_count?: number;
  recipes_count?: number;
  is_followed?: boolean;
}

export interface ProfileRecipe {
  id: string;
  title: string;
  thumbnail_url?: string;
  likes_count: number;
}
