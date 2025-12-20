import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/elements/Card';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center grow p-4 bg-bg">
      <div className="authentication-inner w-full max-w-md">
        <Card className="relative z-[2]">
          <CardHeader className="text-center space-y-3">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              ورود به پنل مدیریت
            </CardTitle>
            <CardDescription className="text-base">
              برای دسترسی به پنل مدیریت، اطلاعات خود را وارد کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
