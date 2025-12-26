import { lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Skeleton } from "@/components/elements/Skeleton";
import { useAuth } from "@/core/auth/AuthContext";
import { Button } from "@/components/elements/Button";

const EditFormSkeleton = () => (
  <div className="space-y-6">
    <div className="rounded-lg border p-6">
      <Skeleton className="h-32 w-full mb-4" />
      <Skeleton className="h-8 w-1/3 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="space-y-4 rounded-lg border p-6">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

const EditAdminForm = lazy(() => import("@/components/admins/edit/EditForm").then((mod) => ({ default: mod.EditAdminForm })));

export default function EditConsultantPage() {
  const params = useParams();
  const consultantId = params?.id as string;
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (!consultantId) {
    return (
      <div className="space-y-6">
        <PageHeader title="ویرایش مشاور املاک" />
        <div className="text-center py-8">
          <p className="text-destructive">شناسه مشاور یافت نشد</p>
        </div>
      </div>
    );
  }

  const isSelfRoute = consultantId === "me" || (user?.id && consultantId === String(user.id));
  const canManageConsultants = Boolean(user?.is_superuser || user?.is_admin_full);

  if (isLoading && !user) {
    return (
      <div className="space-y-6">
        <PageHeader title="ویرایش مشاور املاک" />
        <EditFormSkeleton />
      </div>
    );
  }

  if (!isSelfRoute && !canManageConsultants) {
    return (
      <div className="space-y-6">
        <PageHeader title="ویرایش مشاور املاک" />
        <div className="rounded-lg border p-6 text-center space-y-4">
          <p className="text-destructive">شما فقط می‌توانید پروفایل خود را ویرایش کنید.</p>
          <Button onClick={() => navigate("/admins/me-consultant/edit")}>پروفایل من</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="ویرایش مشاور املاک" />

      <Suspense fallback={<EditFormSkeleton />}>
        <EditAdminForm adminId={consultantId} />
      </Suspense>
    </div>
  );
}
