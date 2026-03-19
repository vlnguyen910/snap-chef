// Mock data cho Home Feed — sẽ thay bằng API calls trong Phase 2.3
export interface RecipeFeedItem {
  id: string;
  title: string;
  image: string;
  createdAt?: string;
  cookTime: string;
  rating: number;
  ratingCount: string;
  likesCount?: number;
  commentsCount?: number;
  difficulty: "Beginner" | "Intermediate" | "Pro";
  author: string;
  authorAvatar: string;
  category?: string;
}

export interface TopChef {
  id: string;
  username: string;
  follower_count: number;
  avatar_url: string | null;
}

export interface TrendingCategory {
  id: number;
  name: string;
  slug: string;
  recipe_count: number;
}

export const MOCK_RECIPES: RecipeFeedItem[] = [
  {
    id: "1",
    title: "Smoked Salmon Avocado Toast",
    image:
      "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=600&q=80",
    cookTime: "15 mins",
    rating: 4.9,
    ratingCount: "1.2k",
    difficulty: "Beginner",
    author: "Sarah Cooks",
    authorAvatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "2",
    title: "Spicy Beef Street Tacos",
    image:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
    cookTime: "35 mins",
    rating: 4.7,
    ratingCount: "840",
    difficulty: "Intermediate",
    author: "Taco Master",
    authorAvatar: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: "3",
    title: "Death by Chocolate Cake",
    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80",
    cookTime: "1h 15m",
    rating: 5.0,
    ratingCount: "2.5k",
    difficulty: "Pro",
    author: "Pastry Chef John",
    authorAvatar: "https://i.pravatar.cc/150?img=3",
  },
  {
    id: "4",
    title: "Classic Creamy Caesar",
    image:
      "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&q=80",
    cookTime: "10 mins",
    rating: 4.5,
    ratingCount: "156",
    difficulty: "Beginner",
    author: "Green Life",
    authorAvatar: "https://i.pravatar.cc/150?img=4",
  },
  {
    id: "5",
    title: "Authentic Thai Green Curry",
    image:
      "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80",
    cookTime: "45 mins",
    rating: 4.8,
    ratingCount: "342",
    difficulty: "Intermediate",
    author: "Chef Somchai",
    authorAvatar: "https://i.pravatar.cc/150?img=5",
  },
  {
    id: "6",
    title: "Perfect Margherita Pizza",
    image:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80",
    cookTime: "25 mins",
    rating: 4.6,
    ratingCount: "2.1k",
    difficulty: "Beginner",
    author: "Pizza Guy",
    authorAvatar: "https://i.pravatar.cc/150?img=6",
  },
];

export const MOCK_TOP_CHEFS: TopChef[] = [
  {
    id: "1",
    username: "Chef Marcus",
    follower_count: 120,
    avatar_url: "https://i.pravatar.cc/150?img=11",
  },
  {
    id: "2",
    username: "Chef Elena",
    follower_count: 85,
    avatar_url: "https://i.pravatar.cc/150?img=12",
  },
  {
    id: "3",
    username: "John Pastry",
    follower_count: 63,
    avatar_url: "https://i.pravatar.cc/150?img=13",
  },
  {
    id: "4",
    username: "Sofia Vegan",
    follower_count: 47,
    avatar_url: "https://i.pravatar.cc/150?img=14",
  },
];

export const MOCK_TRENDING_CATEGORIES: TrendingCategory[] = [
  { id: 1, slug: "quick-easy", name: "Quick & Easy", recipe_count: 2400 },
  { id: 2, slug: "vegan-life", name: "Vegan Life", recipe_count: 1800 },
  { id: 3, slug: "italian-classics", name: "Italian Classics", recipe_count: 3100 },
  { id: 4, slug: "sweet-treats", name: "Sweet Treats", recipe_count: 950 },
];
