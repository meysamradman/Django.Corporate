'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPanelSettings, updatePanelSettings } from '@/api/settings/panel/route';
import { PanelSettings } from '@/types/settings/panelSettings';
import { fetchApi } from '@/core/config/fetch';

export function usePanelSettings() {
  return useQuery({
    queryKey: ['panel-settings'],
    queryFn: getPanelSettings,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useUpdatePanelSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<PanelSettings> | FormData) => {
      const response = await fetchApi.put<PanelSettings>('/admin/panel-settings/update/', data, {
        successMessage: 'تنظیمات پنل با موفقیت به‌روزرسانی شد',
      });
      return response.data;
    },
    onSuccess: (updatedData) => {
      if (updatedData) {
        queryClient.setQueryData(['panel-settings'], updatedData);
      }
      queryClient.invalidateQueries({ queryKey: ['panel-settings'] });
    },
  });
}
