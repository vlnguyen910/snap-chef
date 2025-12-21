import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';

// Pages
import HomePage from '@/pages/HomePage';
import AuthPage from '@/pages/AuthPage';
import RecipesPage from '@/pages/RecipesPage';
import RecipeDetailPage from '@/pages/RecipeDetailPage';
import ModerationPage from '@/pages/ModerationPage';
import CreateRecipePage from '@/pages/CreateRecipePage';
import NotFound from '@/pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout showSidebar={false} />}>
        <Route path="/" element={<HomePage />} />
        {/* Auth Routes */}
        <Route path='/auth'>
          <Route path="signin" element={<AuthPage />} />
          <Route path="signup" element={<AuthPage />} />
        </Route>
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
      </Route>

      {/* Protected User Routes */}
      <Route element={<ProtectedRoute allowedRoles={['user', 'moderator']} />}>
        <Route element={<MainLayout showSidebar={true} />}>
          <Route path="/create-recipe" element={<CreateRecipePage />} />
          <Route path="/profile" element={<div className="p-8"><h1 className="text-2xl font-bold">Profile</h1></div>} />
          <Route path="/my-recipes" element={<RecipesPage />} />
          <Route path="/recipes/create" element={<CreateRecipePage />} />
          <Route path="/recipes/edit/:id" element={<CreateRecipePage />} />
          <Route path="/favorites" element={<div className="p-8"><h1 className="text-2xl font-bold">Favorites</h1></div>} />
          <Route path="/settings" element={<div className="p-8"><h1 className="text-2xl font-bold">Settings</h1></div>} />
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
