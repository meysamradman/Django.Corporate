'use client';

import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/api/shared/notifications/route';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotificationCounts(),
    refetchInterval: 30000, // Refetch every 30 seconds for notifications
    staleTime: 0,
    refetchOnWindowFocus: false, // Don't refetch on window focus - prevent 429 errors
    refetchOnMount: false, // Don't refetch on mount - only use interval
    retry: 2,
  });
}

