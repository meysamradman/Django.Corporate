'use client';

import { usePermission } from '../context/PermissionContext';
import type { UIPermissions } from '../context/PermissionContext';

/**
 * 🚀 Ultra-fast UI Permission Hook
 * 
 * استفاده از pre-computed flags بجای runtime checks
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { canManageSettings, canUploadMedia } = useUIPermissions();
 *   
 *   if (!canManageSettings) return null;
 *   
 *   return <Button>Save Settings</Button>;
 * }
 * ```
 * 
 * Performance:
 * - ❌ Before: hasPermission('settings.manage') - O(1) but re-computes
 * - ✅ After: ui.canManageSettings - Pre-computed, zero overhead
 */
export function useUIPermissions(): UIPermissions {
  const { ui } = usePermission();
  return ui;
}

/**
 * 🎯 Shorthand hooks برای استفاده سریع‌تر
 */
export function useCanManageSettings() {
  const { canManageSettings } = useUIPermissions();
  return canManageSettings;
}

export function useCanUploadMedia() {
  const { canUploadMedia } = useUIPermissions();
  return canUploadMedia;
}

export function useCanManageAI() {
  const { canManageAI } = useUIPermissions();
  return canManageAI;
}

export function useCanManageForms() {
  const { canManageForms } = useUIPermissions();
  return canManageForms;
}

export function useCanManagePanel() {
  const { canManagePanel } = useUIPermissions();
  return canManagePanel;
}

export function useCanManagePages() {
  const { canManagePages } = useUIPermissions();
  return canManagePages;
}

// Media - Type-specific shortcuts
export function useCanUploadImage() {
  const { canUploadImage } = useUIPermissions();
  return canUploadImage;
}

export function useCanUploadVideo() {
  const { canUploadVideo } = useUIPermissions();
  return canUploadVideo;
}

export function useCanUploadAudio() {
  const { canUploadAudio } = useUIPermissions();
  return canUploadAudio;
}

export function useCanUploadDocument() {
  const { canUploadDocument } = useUIPermissions();
  return canUploadDocument;
}

// Statistics - Granular shortcuts
export function useCanViewDashboardStats() {
  const { canViewDashboardStats } = useUIPermissions();
  return canViewDashboardStats;
}

export function useCanViewUsersStats() {
  const { canViewUsersStats } = useUIPermissions();
  return canViewUsersStats;
}

export function useCanViewAdminsStats() {
  const { canViewAdminsStats } = useUIPermissions();
  return canViewAdminsStats;
}

export function useCanViewContentStats() {
  const { canViewContentStats } = useUIPermissions();
  return canViewContentStats;
}

export function useCanExportStats() {
  const { canExportStats } = useUIPermissions();
  return canExportStats;
}

export function useCanManageStatistics() {
  const { canManageStatistics } = useUIPermissions();
  return canManageStatistics;
}
