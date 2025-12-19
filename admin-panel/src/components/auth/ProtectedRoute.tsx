import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (!isLoading && !isAuthenticated) {
    const returnTo = location.pathname !== '/' 
      ? `?return_to=${encodeURIComponent(location.pathname + location.search)}` 
      : '';
    return <Navigate to={`/login${returnTo}`} replace />;
  }

  return <>{children}</>;
}

