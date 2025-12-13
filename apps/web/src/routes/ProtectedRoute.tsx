import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '@/lib/store';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  allowedRoles = ['user', 'moderator'], 
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useStore();

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
