import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/elements/Skeleton";
import { Button } from "@/components/elements/Button";
import { adminApi } from "@/api/admins/admins";
import type { UserWithProfile } from "@/types/auth/user";

const EditUserForm = lazy(() => import("@/components/users/edit/EditForm").then((mod) => ({ default: mod.EditUserForm })));

const EditFormSkeleton = () => (
  <div className="space-y-6">
    <div className="border p-6">
      <Skeleton className="h-32 w-full mb-4" />
      <Skeleton className="h-8 w-1/3 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4 border p-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  </div>
);

interface DynamicEditFormProps {
  userId: string;
}

export function DynamicEditForm({ userId }: DynamicEditFormProps) {
  const navigate = useNavigate();

  const { data: userData, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => adminApi.getUserById(Number(userId)),
    enabled: !!userId,
    staleTime: 0,
  });

  if (isLoading) {
    return <EditFormSkeleton />;
  }

  if (error || !userData) {
    const errorMessage = error instanceof Error ? error.message : "خطایی در بارگذاری اطلاعات کاربر برای ویرایش رخ داده است.";
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{errorMessage}</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          بازگشت
        </Button>
      </div>
    );
  }

  return (
    <Suspense fallback={<EditFormSkeleton />}>
      <EditUserForm userData={userData as UserWithProfile} />
    </Suspense>
  );
}
