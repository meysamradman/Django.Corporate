'use client';

import { usePermission } from '../context/PermissionContext';

/**
 * ✅ Simple hook for single permission check
 * @example
 * const canUpload = useHasPermission('media.upload');
 */
export function useHasPermission(permissionId: string): boolean {
  const { hasPermission } = usePermission();
  return hasPermission(permissionId);
}

