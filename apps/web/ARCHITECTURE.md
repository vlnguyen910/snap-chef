# SnapChef Web - Feature-Based Architecture

## 📁 Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   │   ├── Loading.tsx
│   │   └── ErrorState.tsx
│   ├── layout/          # Layout components
│   │   ├── Header.tsx   # Global navigation
│   │   ├── Sidebar.tsx  # Role-based sidebar
│   │   └── MainLayout.tsx
│   └── ui/              # Shadcn UI components
│       └── button.tsx
│
├── features/            # Feature modules
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   └── hooks/
│   │       └── useAuth.ts
│   ├── recipes/
│   │   ├── components/
│   │   │   ├── RecipeCard.tsx
│   │   │   └── RecipeList.tsx
│   │   └── hooks/
│   │       └── useRecipeActions.ts
│   └── moderation/
│       ├── components/
│       │   └── ApprovalQueue.tsx
│       └── hooks/
│           └── useModeration.ts
│
├── pages/               # Page components
│   ├── HomePage.tsx
│   ├── AuthPage.tsx
│   ├── RecipesPage.tsx
│   ├── RecipeDetailPage.tsx
│   ├── ModerationPage.tsx
│   └── NotFound.tsx
│
├── routes/              # Routing configuration
│   ├── AppRoutes.tsx    # Main route definitions
│   └── ProtectedRoute.tsx
│
├── lib/                 # Core utilities
│   ├── axios.ts         # API client
│   ├── store.ts         # Zustand store
│   └── utils.ts         # Helper functions
│
├── hooks/               # Global custom hooks
│   └── useDebounce.ts
│
├── types/               # TypeScript types
│   └── index.ts
│
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

## 🎯 Key Features

### 1. Authentication System

- Login/Register forms with validation
- Zustand state management for auth
- Protected routes with role-based access
- Token-based authentication

### 2. Recipe Management

- Recipe browsing with search & filters
- Recipe cards with favorite/fork actions
- Detailed recipe view
- User-specific recipe lists

### 3. Moderation System

- Approval queue for pending recipes
- Approve/reject functionality
- Moderator-only routes

### 4. Layout System

- Responsive header with role-based navigation
- Conditional sidebar for authenticated users
- Mobile-friendly hamburger menu

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **React Router v7** for routing
- **Zustand** for state management
- **Axios** for API calls
- **TailwindCSS** for styling
- **Shadcn UI** components
- **Lucide React** icons
- **Vite** build tool

## 🚀 Getting Started

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build
```

## 📝 Route Structure

### Public Routes

- `/` - Homepage
- `/login` - Login page
- `/register` - Register (redirects to /login?mode=register)
- `/recipes` - Browse all recipes
- `/recipes/:id` - Recipe detail

### Protected User Routes (requires auth)

- `/dashboard` - User dashboard
- `/profile` - User profile
- `/my-recipes` - User's recipes
- `/favorites` - Favorited recipes
- `/settings` - User settings

### Protected Moderator Routes (requires moderator role)

- `/moderation` - Moderation dashboard
- `/moderation/queue` - Approval queue
- `/moderation/content` - Content management
- `/moderation/users` - User management
- `/moderation/analytics` - Analytics

## 🔐 Authentication Flow

1. User logs in via `LoginForm`
2. `useAuth` hook calls `/auth/login` endpoint
3. Token stored in Zustand store + localStorage
4. Header shows user menu with role-specific links
5. Protected routes check `isAuthenticated` and `user.role`

## 🎨 UI Components

### Common Components

- `Loading` - Loading spinner with optional fullscreen
- `ErrorState` - Error display with retry button

### Feature Components

- `RecipeCard` - Recipe preview with actions
- `RecipeList` - Searchable/filterable recipe grid
- `ApprovalQueue` - Moderation queue interface

## 📦 State Management

```typescript
// Global store (Zustand)
{
  user: User | null,
  token: string | null,
  isAuthenticated: boolean,
  login: (user, token) => void,
  logout: () => void,
  updateUser: (userData) => void
}
```

## 🔄 API Integration

All API calls use centralized Axios instance with:

- Base URL configuration via env variable
- Request interceptor for auth token
- Response interceptor for 401 handling
- Typed response interfaces

## 🎯 Next Steps

- [ ] Implement recipe creation form
- [ ] Add profile page
- [ ] Implement settings page
- [ ] Add user management for moderators
- [ ] Implement analytics dashboard
- [ ] Add notifications system
- [ ] Implement real-time updates
