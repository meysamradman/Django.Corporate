import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { aiApi } from "@/api/ai/ai";
import type { ActiveCapabilityModelsResponse, AICapability } from "@/types/ai/ai";

interface ProviderOption {
  slug: string;
  name: string;
  capabilities?: Record<string, any>;
}

interface AIModelRow {
  capability: AICapability;
  title: string;
  icon: string;
  isActive: boolean;
  currentProviderSlug: string;
  currentModelName: string;
  options: ProviderOption[];
  allowedModels: string[];
}

export function useAIModelsPageData() {
  const { data: activeData, isLoading: isActiveLoading } = useQuery({
    queryKey: ["ai-active-capabilities"],
    queryFn: async () => {
      const response = await aiApi.models.getActiveCapabilities();
      return response.data as ActiveCapabilityModelsResponse;
    },
    staleTime: 0,
  });

  const { data: providersData, isLoading: isProvidersLoading } = useQuery({
    queryKey: ["ai-available-providers-all"],
    queryFn: async () => {
      const [chatPv, contentPv, imagePv, audioPv] = await Promise.all([
        aiApi.chat.getAvailableProviders(),
        aiApi.content.getAvailableProviders(),
        aiApi.image.getAvailableProviders(),
        aiApi.audio.getAvailableProviders(),
      ]);

      return {
        chat: chatPv.data || [],
        content: contentPv.data || [],
        image: imagePv.data || [],
        audio: audioPv.data || [],
      };
    },
    staleTime: 60_000,
  });

  const isLoading = isActiveLoading || isProvidersLoading;

  const rows = useMemo<AIModelRow[]>(() => {
    const safeActive = activeData || ({} as ActiveCapabilityModelsResponse);
    const safeProviders = providersData || { chat: [], content: [], image: [], audio: [] };

    const items: Array<{ capability: AICapability; title: string; icon: string }> = [
      { capability: "chat", title: "چت", icon: "💬" },
      { capability: "content", title: "محتوا", icon: "✍️" },
      { capability: "image", title: "تصویر", icon: "🖼️" },
      { capability: "audio", title: "صوت (پادکست)", icon: "🎧" },
    ];

    return items.map((item) => {
      const capabilityModel = safeActive[item.capability];
      const availableProviders = safeProviders[item.capability as keyof typeof safeProviders] || [];

      const options: ProviderOption[] = availableProviders.map((provider) => ({
        slug: provider.slug || "unknown",
        name: provider.display_name || provider.provider_name || "Unknown",
        capabilities: (provider as any).capabilities,
      }));

      const selectedProviderObj = options.find((option) => option.slug === capabilityModel?.provider_slug);
      let allowedModels: string[] = [];

      if (selectedProviderObj && selectedProviderObj.capabilities) {
        const capabilityConfig = selectedProviderObj.capabilities[item.capability];
        if (capabilityConfig && Array.isArray(capabilityConfig.models)) {
          allowedModels = capabilityConfig.models;
        }
      }

      return {
        ...item,
        isActive: Boolean(capabilityModel?.is_active),
        currentProviderSlug: capabilityModel?.provider_slug || "",
        currentModelName: capabilityModel?.model_id || "",
        options,
        allowedModels,
      };
    });
  }, [activeData, providersData]);

  return {
    isLoading,
    rows,
  };
}
