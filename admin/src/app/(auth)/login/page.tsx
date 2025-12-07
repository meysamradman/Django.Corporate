"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/elements/Card";
import { Spinner } from "@/components/elements/Spinner";


const LoginForm = dynamic(
  () => import("@/components/auth/LoginForm").then((mod) => mod.LoginForm),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-8 text-primary" />
      </div>
    ),
  }
);

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