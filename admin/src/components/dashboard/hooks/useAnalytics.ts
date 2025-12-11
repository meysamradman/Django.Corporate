import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/analytics/route";
import type { AnalyticsDashboard } from "@/types/analytics/analytics";

export const useAnalytics = () => {
  return useQuery<AnalyticsDashboard>({
    queryKey: ["analytics", "dashboard"],
    queryFn: () => analyticsApi.getDashboard(),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
};
