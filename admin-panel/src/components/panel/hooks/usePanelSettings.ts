import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPanelSettings } from '@/api/panel/panel';
import type { PanelSettings } from '@/types/settings/panelSettings';
import { api } from '@/core/config/api';
import { notifyApiError, showSuccess } from '@/core/toast';
import { useAuth } from '@/core/auth/AuthContext';

export function usePanelSettings() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isSuperAdmin = Boolean(user?.is_superuser || user?.is_admin_full);

  return useQuery({
    queryKey: ['panel-settings'],
    queryFn: getPanelSettings,
    staleTime: 0,
    gcTime: 0,
    enabled: !isAuthLoading && isSuperAdmin,
  });
}

export function useUpdatePanelSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<PanelSettings> | FormData) => {
      const response = await api.put<PanelSettings>('/admin/panel-settings/update/', data);
      return response.data;
    },
    onSuccess: (updatedData) => {
      if (updatedData) {
        queryClient.setQueryData(['panel-settings'], updatedData);
      }
      queryClient.invalidateQueries({ queryKey: ['panel-settings'] });
      showSuccess('تنظیمات پنل با موفقیت به‌روزرسانی شد');
    },
    onError: (error: unknown) => {
      notifyApiError(error, {
        fallbackMessage: 'خطا در به‌روزرسانی تنظیمات پنل',
        dedupeKey: 'panel-settings-update',
      });
    },
  });
}
