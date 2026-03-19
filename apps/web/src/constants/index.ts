export const API_ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },
  RECIPES: {
    BASE: "/recipes",
    DETAIL: (id: string) => `/recipes/${id}`,
    LIKE: (id: string) => `/recipes/${id}/like`,
    BOOKMARK: (id: string) => `/recipes/${id}/bookmark`,
    USER_RECIPES: (userId: string) => `/recipes/user/${userId}`,
  },
  USERS: {
    BASE: "/users",
    PROFILE: (id: string) => `/users/${id}/profile`,
    ME: "/users/me",
    FOLLOW: (id: string) => `/users/${id}/follow`,
    LIKES: "/users/me/likes",
    FOLLOWERS: (id: string) => `/users/${id}/followers`,
    FOLLOWING: (id: string) => `/users/${id}/following`,
    SEARCH: "/users/search",
  },
};

export const USER_ROLES = {
  GUEST: "guest",
  USER: "user",
  MODERATOR: "moderator",
  ADMIN: "admin",
} as const;

export const RECIPE_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  PUBLISHED: "published",
  REJECTED: "rejected",
  APPROVED: "approved",
} as const;
