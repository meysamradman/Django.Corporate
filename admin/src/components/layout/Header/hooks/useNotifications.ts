'use client';

import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications/route';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotificationCounts(),
    refetchInterval: 30000,
    staleTime: 0,
    retry: 2,
  });
}

