'use client';

import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications/route';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotificationCounts(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 0, // Always consider stale to refetch
    retry: 2,
  });
}

