import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPanelSettings } from '@/api/panel/panel';
import type { PanelSettings } from '@/types/settings/panelSettings';
import { api } from '@/core/config/api';
import { showError, showSuccess } from '@/core/toast';

export function usePanelSettings() {
  return useQuery({
    queryKey: ['panel-settings'],
    queryFn: getPanelSettings,
    staleTime: 0,
    gcTime: 0,
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
    onError: (_error) => {
      showError('خطا در به‌روزرسانی تنظیمات پنل');
    },
  });
}
