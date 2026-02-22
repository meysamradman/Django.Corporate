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

const EditAgentForm = lazy(() => import("@/components/agents/edit/EditForm").then((mod) => ({ default: mod.EditAgentForm })));

export default function EditAgentPage() {
  const params = useParams();
  const agentId = params?.id as string;
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (!agentId) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-destructive">شناسه مشاور یافت نشد</p>
        </div>
      </div>
    );
  }

  const isSelfRoute = agentId === "me" || (user?.id && agentId === String(user.id));
  const canManageAgents = Boolean(user?.is_superuser || user?.is_admin_full);

  if (isLoading && !user) {
    return (
      <div className="space-y-6">
        <EditFormSkeleton />
      </div>
    );
  }

  if (!isSelfRoute && !canManageAgents) {
    return (
      <div className="space-y-6">
        <div className="border p-6 text-center space-y-4">
          <p className="text-destructive">شما فقط می‌توانید پروفایل خود را ویرایش کنید.</p>
          <Button onClick={() => navigate("/agents/me/view")}>پروفایل من</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<EditFormSkeleton />}>
        <EditAgentForm agentId={agentId} />
      </Suspense>
    </div>
  );
}

