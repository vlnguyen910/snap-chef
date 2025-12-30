import { Navigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import HomePage from '@/pages/HomePage';

/**
 * RootRedirect Component
 * Handles conditional rendering for the root path (/)
 * - If authenticated: Redirect to /recipes
 * - If not authenticated: Show HomePage (Landing Page)
 */
export default function RootRedirect() {
  const { isAuthenticated } = useStore();

  // If user is logged in, redirect to recipes page
  if (isAuthenticated) {
    return <Navigate to="/recipes" replace />;
  }

  // If user is not logged in, show the landing page
  return <HomePage />;
}
