"use client";

import { useSearchParams } from "next/navigation";
import { AccessDenied } from "@/core/permissions/components/AccessDenied";

export default function AccessDeniedPage() {
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

