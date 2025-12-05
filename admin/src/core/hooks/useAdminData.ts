'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showErrorToast, showSuccessToast } from '@/core/config/errorHandler';
import { PanelSettings } from '@/types/settings/panelSettings';
import { getPanelSettings, updatePanelSettings } from '@/api/settings/panel/route';
import { adminApi } from '@/api/admins/route';
import { useAuth } from '@/core/auth/AuthContext';

export const useAdminProfile = () => {
  return useQuery({
    queryKey: ['admin-profile'],
    queryFn: () => adminApi.getProfile(),
    staleTime: 0,
    gcTime: 0,
  });
};

export const usePanelSettings = () => {
  return useQuery({
    queryKey: ['panel-settings'],
    queryFn: () => getPanelSettings(),
    staleTime: 0,
    gcTime: 0,
  });
};

export const useUpdatePanelSettings = () => {
  const queryClient = useQueryClient();
  const { updatePanelSettingsInContext } = useAuth();
  
  return useMutation({
    mutationFn: (data: Partial<PanelSettings> | FormData) => updatePanelSettings(data as any),
    onSuccess: (response) => {
      const updatedData = response.data;
      if (updatedData) {
        queryClient.setQueryData(['panel-settings'], updatedData);
        updatePanelSettingsInContext(updatedData);
      }
      showSuccessToast('تنظیمات با موفقیت به‌روزرسانی شد');
    },
    onError: (error) => {
      showErrorToast(error, 'خطا در به‌روزرسانی تنظیمات');
    },
  });
};

 