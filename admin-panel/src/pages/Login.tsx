import { Navigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/elements/Card';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/core/auth/AuthContext';
import { Spinner } from '@/components/elements/Spinner';

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    const returnTo = searchParams.get('return_to') || '/dashboard';
    return <Navigate to={returnTo} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8f9fa]">
      <div className="w-full max-w-md">
        <Card className="shadow-[0_6px_24px_rgba(0,0,0,0.02),0_0_0_1px_rgba(0,0,0,0.02)] border border-br/50 bg-card rounded-xl">
          <CardHeader className="text-center pb-6 pt-8 px-8">
            <CardTitle className="text-2xl font-semibold text-font-p mb-1.5">
              ورود به پنل مدیریت
            </CardTitle>
            <CardDescription className="text-sm text-font-s">
              برای دسترسی به پنل مدیریت، اطلاعات خود را وارد کنید
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
