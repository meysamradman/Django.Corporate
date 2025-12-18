import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/api/shared/notifications/notification';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotificationCounts(),
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
}

