import { Navigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/elements/Card';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/core/auth/AuthContext';
import { useEffect, useState } from 'react';

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [isInitialCheck, setIsInitialCheck] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setIsInitialCheck(false);
    }
  }, [isLoading]);

  if (isInitialCheck && isLoading) {
    return null;
  }

  if (isAuthenticated) {
    const returnTo = searchParams.get('return_to') || '/dashboard';
    return <Navigate to={returnTo} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center grow p-4 bg-bg">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border border-br bg-card">
          <CardHeader className="text-center space-y-3 pb-6">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              ورود به پنل مدیریت
            </CardTitle>
            <CardDescription className="text-base text-font-s">
              برای دسترسی به پنل مدیریت، اطلاعات خود را وارد کنید
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
