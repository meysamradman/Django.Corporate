"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AccessDenied } from "@/core/permissions/components/AccessDenied";

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const permission = searchParams.get('permission') || undefined;
  const module = searchParams.get('module') || undefined;
  const action = searchParams.get('action') || undefined;
  const message = searchParams.get('message') || undefined;
  
  return (
    <AccessDenied
      message={message}
      permission={permission}
      module={module}
      action={action}
    />
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">در حال بارگذاری...</div>}>
      <AccessDeniedContent />
    </Suspense>
  );
}

