import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { adminApi } from "@/api/admins/admins";
import { Alert, AlertDescription } from "@/components/elements/Alert";
import { Button } from "@/components/elements/Button";
import { Skeleton } from "@/components/elements/Skeleton";
import { UserProfileView } from "@/components/users/view/ProfileView";
import type { UserWithProfile } from "@/types/auth/user";
import "@/pages/users/user-profile-pages.css";

const ViewUserSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-12 w-64" />
    <Skeleton className="h-[460px] w-full" />
  </div>
);

export default function ViewUserPage() {
  const params = useParams();
  const navigate = useNavigate();
  const userId = params?.id as string;

  const { data: userData, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => adminApi.getUserById(Number(userId)),
    enabled: !!userId,
    staleTime: 0,
  });

  if (!userId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>شناسه کاربر معتبر نیست.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <ViewUserSkeleton />;
  }

  if (error || !userData) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>خطا در دریافت اطلاعات کاربر.</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate("/users")}>بازگشت به لیست</Button>
      </div>
    );
  }

  return <UserProfileView userData={userData as UserWithProfile} />;
}
