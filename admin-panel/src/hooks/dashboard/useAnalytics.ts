import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/analytics/analytics";
import type { AnalyticsDashboard } from "@/types/analytics";

export const useAnalytics = () => {
  return useQuery<AnalyticsDashboard>({
    queryKey: ["analytics", "dashboard"],
    queryFn: () => analyticsApi.getDashboard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

export const useContentTrend = () => {
  return useQuery<any[]>({
    queryKey: ["analytics", "content_trend"],
    queryFn: () => analyticsApi.getContentTrend(),
    staleTime: 5 * 60 * 1000,
  });
};
