import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { adminApi } from "@/api/admins/admins";
import { Alert, AlertDescription } from "@/components/elements/Alert";
import { Skeleton } from "@/components/elements/Skeleton";
import { UserProfileView } from "@/components/users/view/ProfileView";
import type { UserWithProfile } from "@/types/auth/user";

interface DynamicUserProfileViewProps {
  userId: string;
}

const ViewUserSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-12 w-64" />
    <Skeleton className="h-[460px] w-full" />
  </div>
);

export function DynamicUserProfileView({ userId }: DynamicUserProfileViewProps) {
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => adminApi.getUserById(Number(userId)),
    enabled: !!userId,
    staleTime: 0,
  });

  if (isLoading) {
    return <ViewUserSkeleton />;
  }

  if (error || !userData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>خطا در دریافت اطلاعات کاربر.</AlertDescription>
      </Alert>
    );
  }

  return <UserProfileView userData={userData as UserWithProfile} />;
}
