"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/elements/Skeleton";
import { Button } from "@/components/elements/Button";
import { adminApi } from "@/api/admins/route";

const EditFormSkeleton = () => (
  <div className="space-y-6">
    <div className="rounded-lg border p-6">
      <Skeleton className="h-32 w-full mb-4" />
      <Skeleton className="h-8 w-1/3 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4 rounded-lg border p-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  </div>
);

const EditUserForm = dynamic(
  () => import("@/components/users/edit/EditForm").then((mod) => ({ default: mod.EditUserForm })),
  {
    ssr: false,
    loading: () => <EditFormSkeleton />,
  }
);

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const { data: userData, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => adminApi.getUserById(Number(userId)),
    enabled: !!userId,
    staleTime: 0,
  });

  if (!userId) {
    return (
      <div className="space-y-6">
        <h1 className="page-title">ویرایش کاربر</h1>
        <div className="text-center py-8">
          <p className="text-destructive">شناسه کاربر یافت نشد</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">ویرایش کاربر</h1>
        </div>
        <EditFormSkeleton />
      </div>
    );
  }

  if (error || !userData) {
    let errorMessage = "خطایی در بارگذاری اطلاعات کاربر برای ویرایش رخ داده است.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">ویرایش کاربر</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-destructive">{errorMessage}</p>
          <Button onClick={() => router.back()} className="mt-4">
            بازگشت
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">ویرایش کاربر</h1>
      </div>
      <EditUserForm userData={userData as any} />
    </div>
  );
}