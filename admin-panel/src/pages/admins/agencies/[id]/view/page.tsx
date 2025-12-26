import { lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Skeleton } from "@/components/elements/Skeleton";
import { useAuth } from "@/core/auth/AuthContext";
import { Button } from "@/components/elements/Button";

const ViewSkeleton = () => (
  <div className="space-y-6">
    <div className="rounded-lg border p-6">
      <Skeleton className="h-32 w-full mb-4" />
      <Skeleton className="h-8 w-1/3 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="rounded-lg border p-6">
        <Skeleton className="h-6 w-1/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="rounded-lg border p-6">
        <Skeleton className="h-6 w-1/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  </div>
);

const AgencyViewContent = lazy(() => import("@/components/real-estate/agencies/view/AgencyViewContent"));

export default function AdminsAgenciesViewPage() {
  const params = useParams();
  const agencyId = params?.id as string;
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (!agencyId) {
    return (
      <div className="space-y-6">
        <PageHeader title="مشاهده آژانس" />
        <div className="text-center py-8">
          <p className="text-destructive">شناسه آژانس یافت نشد</p>
        </div>
      </div>
    );
  }

  const canViewAgencies = Boolean(user?.is_superuser || user?.is_admin_full);

  if (isLoading && !user) {
    return (
      <div className="space-y-6">
        <PageHeader title="مشاهده آژانس" />
        <ViewSkeleton />
      </div>
    );
  }

  if (!canViewAgencies) {
    return (
      <div className="space-y-6">
        <PageHeader title="مشاهده آژانس" />
        <div className="rounded-lg border p-6 text-center space-y-4">
          <p className="text-destructive">شما دسترسی مشاهده این صفحه را ندارید.</p>
          <Button onClick={() => navigate("/admins/agencies")}>بازگشت به لیست</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مشاهده آژانس">
        <Button onClick={() => navigate(`/admins/agencies/${agencyId}/edit`)}>
          ویرایش
        </Button>
      </PageHeader>

      <Suspense fallback={<ViewSkeleton />}>
        <AgencyViewContent agencyId={agencyId} />
      </Suspense>
    </div>
  );
}


