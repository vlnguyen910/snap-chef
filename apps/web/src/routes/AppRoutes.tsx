import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import RootRedirect from './RootRedirect';

// Pages
import AuthPage from '@/pages/AuthPage';
import RecipesPage from '@/pages/RecipesPage';
import RecipeDetailPage from '@/pages/RecipeDetailPage';
import ModerationPage from '@/pages/ModerationPage';
import CreateRecipePage from '@/pages/CreateRecipePage';
import NotFound from '@/pages/NotFound';
import EditRecipePage from '@/pages/EditRecipePage';
import FollowListPage from '@/pages/FollowListPage';
import MyRecipesPage from '@/pages/MyRecipesPage';
import FavoritesPage from '@/pages/FavoritesPage';
import SettingsPage from '@/pages/SettingsPage';
import UserSearchPage from '@/pages/UserSearchPage';

// Components
import UserProfile from '@/components/common/UserProfile';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout showSidebar={false} />}>
        {/* Root path with conditional redirect */}
        <Route path="/" element={<RootRedirect />} />
        {/* Auth Routes */}
        <Route path='/auth'>
          <Route path="signin" element={<AuthPage />} />
          <Route path="signup" element={<AuthPage />} />
        </Route>
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        {/* Public User Profile */}
        <Route path="/users/:id/profile" element={<UserProfile />} />
        <Route path="/users/:id/followers" element={<FollowListPage />} />
        <Route path="/users/:id/following" element={<FollowListPage />} />
        {/* Public User Search */}
        <Route path="/users/search" element={<UserSearchPage />} />
      </Route>

      {/* Protected User Routes */}
      <Route element={<ProtectedRoute allowedRoles={['user', 'moderator']} />}>
        <Route element={<MainLayout showSidebar={true} />}>
          <Route path="/create-recipe" element={<CreateRecipePage />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/my-recipes" element={<MyRecipesPage />} />
          <Route path="/recipes/create" element={<CreateRecipePage />} /> 
          <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
          <Route path="/follow" element={<FollowListPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Protected Moderator Routes */}
      <Route element={<ProtectedRoute allowedRoles={['moderator']} />}>
        <Route element={<MainLayout showSidebar={true} />}>
          <Route path="/moderation" element={<ModerationPage />} />
          <Route path="/moderation/queue" element={<ModerationPage />} />
          <Route path="/moderation/content" element={<div className="p-8"><h1 className="text-2xl font-bold">Content Management</h1></div>} />
          <Route path="/moderation/users" element={<div className="p-8"><h1 className="text-2xl font-bold">User Management</h1></div>} />
          <Route path="/moderation/analytics" element={<div className="p-8"><h1 className="text-2xl font-bold">Analytics</h1></div>} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
