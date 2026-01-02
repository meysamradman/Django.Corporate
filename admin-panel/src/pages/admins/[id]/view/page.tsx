import { lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Skeleton } from "@/components/elements/Skeleton";
import { useAuth } from "@/core/auth/AuthContext";
import { Button } from "@/components/elements/Button";

const ViewSkeleton = () => (
  <div className="space-y-6">
    <div className="border p-6">
      <Skeleton className="h-32 w-full mb-4" />
      <Skeleton className="h-8 w-1/3 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border p-6">
        <Skeleton className="h-6 w-1/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="border p-6">
        <Skeleton className="h-6 w-1/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  </div>
);

const AdminViewContent = lazy(() => import("@/components/admins/view/AdminViewContent"));

export default function ViewAdminPage() {
  const params = useParams();
  const adminId = params?.id as string;
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (!adminId) {
    return (
      <div className="space-y-6">
        <PageHeader title="مشاهده ادمین" />
        <div className="text-center py-8">
          <p className="text-destructive">شناسه ادمین یافت نشد</p>
        </div>
      </div>
    );
  }

  const isSelfRoute = adminId === "me" || (user?.id && adminId === String(user.id));
  const canViewAdmins = Boolean(user?.is_superuser || user?.is_admin_full);

  if (isLoading && !user) {
    return (
      <div className="space-y-6">
        <PageHeader title="مشاهده ادمین" />
        <ViewSkeleton />
      </div>
    );
  }

  if (!isSelfRoute && !canViewAdmins) {
    return (
      <div className="space-y-6">
        <PageHeader title="مشاهده ادمین" />
        <div className="border p-6 text-center space-y-4">
          <p className="text-destructive">شما دسترسی مشاهده این صفحه را ندارید.</p>
          <Button onClick={() => navigate("/admins/me/edit")}>پروفایل من</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مشاهده ادمین">
        <Button onClick={() => navigate(`/admins/${adminId}/edit`)}>
          ویرایش
        </Button>
      </PageHeader>

      <Suspense fallback={<ViewSkeleton />}>
        <AdminViewContent adminId={adminId} />
      </Suspense>
    </div>
  );
}
