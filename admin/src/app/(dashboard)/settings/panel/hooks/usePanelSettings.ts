'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPanelSettings } from '@/api/settings/panel/route';
import { PanelSettings } from '@/types/settings/panelSettings';
import { fetchApi } from '@/core/config/fetch';
import { toast } from '@/components/elements/Sonner';

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
      const response = await fetchApi.put<PanelSettings>('/admin/panel-settings/update/', data);
      return response.data;
    },
    onSuccess: (updatedData) => {
      if (updatedData) {
        queryClient.setQueryData(['panel-settings'], updatedData);
      }
      queryClient.invalidateQueries({ queryKey: ['panel-settings'] });
      toast.success('تنظیمات پنل با موفقیت به‌روزرسانی شد');
    },
    onError: (error) => {
      toast.error('خطا در به‌روزرسانی تنظیمات پنل');
    },
  });
}
