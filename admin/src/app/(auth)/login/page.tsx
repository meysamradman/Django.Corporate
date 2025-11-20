import { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/elements/Card";


export const metadata: Metadata = {
  title: "ورود به پنل مدیریت",
  description: "اطلاعات کاربری خود را برای دسترسی به پنل مدیریت وارد کنید.",
};

export default function LoginPage() {

  
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