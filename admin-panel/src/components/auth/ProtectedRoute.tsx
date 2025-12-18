import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ✅ راه حل حرفه‌ای: Layout همیشه نمایش داده میشه
 * فقط محتوای داخلی (Outlet) در حالت بارگذاری skeleton نشون میده
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // ✅ حذف شد: دیگه null برنمیگردونیم
  // Layout همیشه رندر میشه، فقط محتوا عوض میشه

  if (!isLoading && !isAuthenticated) {
    const returnTo = location.pathname !== '/' 
      ? `?return_to=${encodeURIComponent(location.pathname + location.search)}` 
      : '';
    return <Navigate to={`/login${returnTo}`} replace />;
  }

  return <>{children}</>;
}

