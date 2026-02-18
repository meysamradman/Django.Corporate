import { lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/elements/Skeleton";
import { useAuth } from "@/core/auth/AuthContext";
import { Button } from "@/components/elements/Button";

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

export default function EditAdminPage() {
  const params = useParams();
  const adminId = params?.id as string;
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (!adminId) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-destructive">شناسه ادمین یافت نشد</p>
        </div>
      </div>
    );
  }

  const isSelfRoute = adminId === "me" || (user?.id && adminId === String(user.id));
  const canManageAdmins = Boolean(user?.is_superuser || user?.is_admin_full);

  if (isLoading && !user) {
    return (
      <div className="space-y-6">
        <EditFormSkeleton />
      </div>
    );
  }

  if (!isSelfRoute && !canManageAdmins) {
    return (
      <div className="space-y-6">
        <div className="border p-6 text-center space-y-4">
          <p className="text-destructive">شما فقط می‌توانید پروفایل خود را مشاهده یا ویرایش کنید.</p>
          <Button onClick={() => navigate("/admins/me/edit")}>پروفایل من</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<EditFormSkeleton />}>
        <EditAdminForm adminId={adminId} />
      </Suspense>
    </div>
  );
} 