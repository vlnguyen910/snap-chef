import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '@/lib/store';
import Loading from '@/components/common/Loading';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  allowedRoles = ['user', 'moderator'], 
  redirectTo = '/auth/signin' 
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isInitialized } = useStore();

  // Wait for store to finish hydrating from localStorage
  if (!isInitialized) {
    return <Loading fullScreen message="Checking authentication..." />;
  }

  // After initialization, check authentication
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check role permissions
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
