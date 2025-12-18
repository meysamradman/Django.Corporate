'use client';

import { usePermission } from '../context/PermissionContext';

export function useHasPermission(permissionId: string): boolean {
  const { hasPermission } = usePermission();
  return hasPermission(permissionId);
}

