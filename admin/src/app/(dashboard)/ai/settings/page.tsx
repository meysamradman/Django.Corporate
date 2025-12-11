"use client";

import React from 'react';
import AISettingsPage from '@/components/ai/settings/AISettingsPage';
import { usePermission } from '@/core/permissions/context/PermissionContext';
import { AccessDenied } from '@/core/permissions/components/AccessDenied';
import { Skeleton } from '@/components/elements/Skeleton';

export default function AISettingsPageRoute() {
  const { hasAnyPermission, isLoading } = usePermission();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!hasAnyPermission(['ai.manage', 'ai.settings.personal.manage', 'ai.settings.shared.manage'])) {
    return <AccessDenied />;
  }

  return <AISettingsPage />;
}
