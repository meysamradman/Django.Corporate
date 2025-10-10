import { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/elements/Card";


export const metadata: Metadata = {
  title: "ورود به پنل مدیریت",
  description: "اطلاعات کاربری خود را برای دسترسی به پنل مدیریت وارد کنید.",
};

export default function LoginPage() {

  
  return (
    <div className="min-h-screen flex items-center justify-center grow p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">
              ورود به پنل مدیریت
            </CardTitle>
            <CardDescription className="">
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