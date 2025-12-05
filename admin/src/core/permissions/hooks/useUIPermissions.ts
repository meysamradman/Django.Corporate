'use client';

import { usePermission } from '../context/PermissionContext';
import type { UIPermissions } from '../context/PermissionContext';

export function useUIPermissions(): UIPermissions {
  const { ui } = usePermission();
  return ui;
}

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

export function useCanManageAIChat() {
  const { canManageAIChat } = useUIPermissions();
  return canManageAIChat;
}

export function useCanManageAIContent() {
  const { canManageAIContent } = useUIPermissions();
  return canManageAIContent;
}

export function useCanManageAIImage() {
  const { canManageAIImage } = useUIPermissions();
  return canManageAIImage;
}

export function useCanManageAIAudio() {
  const { canManageAIAudio } = useUIPermissions();
  return canManageAIAudio;
}

export function useCanManageAISettings() {
  const { canManageAISettings } = useUIPermissions();
  return canManageAISettings;
}

export function useCanManageSharedAISettings() {
  const { canManageSharedAISettings } = useUIPermissions();
  return canManageSharedAISettings;
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
