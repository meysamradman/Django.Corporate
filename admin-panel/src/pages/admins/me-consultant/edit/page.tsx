import { lazy, Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Skeleton } from "@/components/elements/Skeleton";
import { useAuth } from "@/core/auth/AuthContext";

const EditFormSkeleton = () => (
  <div className="space-y-6">
    <div className="border p-6">
      <Skeleton className="h-32 w-full mb-4" />
      <Skeleton className="h-8 w-1/3 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="space-y-4 border p-6">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

const EditAdminForm = lazy(() => import("@/components/admins/edit/EditForm").then((mod) => ({ default: mod.EditAdminForm })));

export default function MyConsultantProfilePage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth/login');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="پروفایل من" description="مدیریت پروفایل مشاور و تنظیمات حساب کاربری" />
        <EditFormSkeleton />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="پروفایل من" description="مدیریت پروفایل مشاور و تنظیمات حساب کاربری" />
      
      <Suspense fallback={<EditFormSkeleton />}>
        <EditAdminForm adminId="me" />
      </Suspense>
    </div>
  );
}
