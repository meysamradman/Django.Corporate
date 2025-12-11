'use client';

import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/api/shared/notifications/route';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotificationCounts(),
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 30000, // Refetch every 30 seconds for notifications
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
}

