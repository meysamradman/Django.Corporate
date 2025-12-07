"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/elements/Skeleton";
import { useAuth } from "@/core/auth/AuthContext";
import { Button } from "@/components/elements/Button";
import { Spinner } from "@/components/elements/Spinner";

const EditAdminForm = dynamic(
  () => import("@/components/admins/edit/EditForm").then((mod) => mod.EditAdminForm),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-8 text-primary" />
      </div>
    ),
  }
);

export default function EditAdminPage() {
  const params = useParams();
  const adminId = params?.id as string;
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (!adminId) {
    return (
      <div className="space-y-6">
        <h1 className="page-title">ویرایش ادمین</h1>
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
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isSelfRoute && !canManageAdmins) {
    return (
      <div className="space-y-6">
        <h1 className="page-title">ویرایش ادمین</h1>
        <div className="rounded-lg border p-6 text-center space-y-4">
          <p className="text-destructive">شما فقط می‌توانید پروفایل خود را مشاهده یا ویرایش کنید.</p>
          <Button onClick={() => router.push("/admins/me/edit")}>پروفایل من</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">ویرایش ادمین</h1>
      </div>

      <EditAdminForm adminId={adminId} />
    </div>
  );
} 