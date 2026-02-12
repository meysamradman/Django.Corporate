import { useEffect } from "react";
import type { NavigateFunction } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { aiApi } from "@/api/ai/ai";
import { useUserPermissions } from "@/core/permissions";
import { useAuth } from "@/core/auth/AuthContext";
import { showError, showSuccess } from "@/core/toast";
import type { AICapability } from "@/types/ai/ai";

interface UseAIModelsActionsParams {
  navigate: NavigateFunction;
}

export function useAIModelsActions({ navigate }: UseAIModelsActionsParams) {
  const queryClient = useQueryClient();
  const { isLoading: isAuthLoading } = useAuth();
  const { isSuperAdmin, hasPermission } = useUserPermissions();

  const hasAccess = isSuperAdmin || hasPermission("ai.manage");

  useEffect(() => {
    if (!isAuthLoading && !hasAccess) {
      showError("این صفحه فقط برای سوپر ادمین‌ها قابل دسترسی است");
      navigate("/ai/settings", { replace: true });
    }
  }, [isAuthLoading, hasAccess, navigate]);

  const selectProviderMutation = useMutation({
    mutationFn: async ({ capability, provider, model_id }: { capability: AICapability; provider: string; model_id?: string }) => {
      return aiApi.models.selectModel({ capability, provider, model_id });
    },
    onSuccess: (_, { capability }) => {
      showSuccess(`تنظیمات ${capability} ذخیره شد`);
      queryClient.invalidateQueries({ queryKey: ["ai-active-capabilities"] });
    },
    onError: (error) => {
      showError(error);
    },
  });

  return {
    selectProviderMutation,
  };
}
