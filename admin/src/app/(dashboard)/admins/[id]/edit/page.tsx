"use client";

import { EditAdminForm } from "./EditForm";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/elements/Skeleton";

export default function EditAdminPage() {
  const params = useParams();
  const adminId = params?.id as string;

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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="page-title">ویرایش ادمین</h1>
      </div>

      {/* Main Content Card */}
      <EditAdminForm adminId={adminId} />
    </div>
  );
} 