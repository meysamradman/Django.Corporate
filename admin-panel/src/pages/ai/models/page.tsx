import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card';
import { Skeleton } from '@/components/elements/Skeleton';
import { Button } from '@/components/elements/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/elements/Select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/api/ai/ai';
import { useUserPermissions } from '@/core/permissions';
import { useAuth } from '@/core/auth/AuthContext';
import { showError, showSuccess } from '@/core/toast';
import type { ActiveCapabilityModelsResponse, AICapability } from '@/types/ai/ai';

interface ProviderOption {
  slug: string;
  name: string;
  capabilities?: Record<string, any>;
}

export default function AIModelsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoading: isAuthLoading } = useAuth();
  const { isSuperAdmin, hasPermission } = useUserPermissions();

  const hasAccess = isSuperAdmin || hasPermission('ai.manage');

  // Fetch the current active configuration
  const { data: activeData, isLoading: isActiveLoading } = useQuery({
    queryKey: ['ai-active-capabilities'],
    queryFn: async () => {
      const response = await aiApi.models.getActiveCapabilities();
      return response.data as ActiveCapabilityModelsResponse;
    },
    staleTime: 0,
  });

  // Fetch all available providers for dropdowns
  const { data: providersData, isLoading: isProvidersLoading } = useQuery({
    queryKey: ['ai-available-providers-all'],
    queryFn: async () => {
      // Fetch providers for each capability in parallel
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

  // Mutation to change provider or model
  const selectProviderMutation = useMutation({
    mutationFn: async ({ capability, provider, model_id }: { capability: AICapability; provider: string; model_id?: string }) => {
       console.log(`[Frontend] Selecting Provider/Model for ${capability}:`, { provider, model_id });
       return aiApi.models.selectModel({ capability, provider, model_id });
    },
    onSuccess: (_, { capability }) => {
      console.log(`[Frontend] Successfully updated ${capability}`);
      showSuccess(`تنظیمات ${capability} ذخیره شد`);
      queryClient.invalidateQueries({ queryKey: ['ai-active-capabilities'] });
    },
    onError: (err) => {
      console.error('[Frontend] Error updating:', err);
      showError(err);
    },
  });

  const rows = useMemo(() => {
    const safeActive = activeData || ({} as ActiveCapabilityModelsResponse);
    const safeProviders = providersData || { chat: [], content: [], image: [], audio: [] };

    const items: Array<{ capability: AICapability; title: string; icon: string }> = [
      { capability: 'chat', title: 'چت', icon: '💬' },
      { capability: 'content', title: 'محتوا', icon: '✍️' },
      { capability: 'image', title: 'تصویر', icon: '🖼️' },
      { capability: 'audio', title: 'صوت (پادکست)', icon: '🎧' },
    ];

    return items.map((item) => {
      const cm = safeActive[item.capability];
      const availableProviders = safeProviders[item.capability as keyof typeof safeProviders] || [];
      
      const options: ProviderOption[] = availableProviders.map((p) => ({
        slug: p.slug || 'unknown',
        name: p.display_name || p.provider_name || 'Unknown',
        capabilities: (p as any).capabilities, 
      }));
      
      // Find currently selected provider to get its hardcoded model list
      const selectedProviderObj = options.find(o => o.slug === cm?.provider_slug);
      let allowedModels: string[] = [];
      
      // Get hardcoded models from provider capabilities
      if (selectedProviderObj && selectedProviderObj.capabilities) {
          const capConfig = selectedProviderObj.capabilities[item.capability];
          if (capConfig && Array.isArray(capConfig.models)) {
              allowedModels = capConfig.models;
          }
      }

      return {
        ...item,
        isActive: Boolean(cm?.is_active),
        currentProviderSlug: cm?.provider_slug || '',
        currentModelName: cm?.model_id || '',
        options,
        allowedModels,
      };
    });
  }, [activeData, providersData]);

  useEffect(() => {
    if (!isAuthLoading && !hasAccess) {
      showError('این صفحه فقط برای سوپر ادمین‌ها قابل دسترسی است');
      navigate('/ai/settings', { replace: true });
    }
  }, [isAuthLoading, hasAccess, navigate]);

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <Card className="shadow-sm border">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-pink">
              <Sparkles className="w-5 h-5 text-pink-2" />
            </div>
            <div>
              <div>تنظیمات مدل‌های AI</div>
              <p className="text-sm font-normal text-font-s mt-1">
                انتخاب ارائه‌دهنده (Provider) برای هر قابلیت. مدل‌ها به صورت Hardcode تعریف شده‌اند.
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {rows.map((row) => (
                <div key={row.capability} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-5 gap-4">
                  
                  {/* Left: Icon & Title */}
                  <div className="flex items-center gap-3 min-w-[150px] sm:min-w-[180px]">
                    <span className="text-2xl">{row.icon}</span>
                    <div>
                      <div className="font-medium text-lg text-font-p">{row.title}</div>
                      <div className="text-xs text-font-s">
                        {row.isActive ? (
                          <span className="text-success-default">فعال: {row.currentModelName}</span>
                        ) : (
                          <span className="text-error-default">تنظیم نشده</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Provider Select & Model Select */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 justify-end max-w-2xl w-full">
                    
                    {/* Provider Select */}
                    <div className="w-full sm:w-1/2">
                      <Select
                        dir="rtl"
                        value={row.currentProviderSlug}
                        onValueChange={(val) => selectProviderMutation.mutate({ capability: row.capability, provider: val })}
                        disabled={selectProviderMutation.isPending}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="انتخاب Provider..." />
                        </SelectTrigger>
                        <SelectContent>
                          {row.options.length === 0 ? (
                            <div className="p-2 text-sm text-center text-font-s">
                              هیچ ارائه‌دهنده‌ای یافت نشد
                            </div>
                          ) : (
                            row.options.map((opt) => (
                              <SelectItem key={opt.slug} value={opt.slug}>
                                {opt.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Model Display/Select */}
                    <div className="w-full sm:w-1/2">
                        {row.allowedModels.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-font-s border rounded-md bg-surface-s">
                            مدلی تعریف نشده
                          </div>
                        ) : row.allowedModels.length === 1 ? (
                          <div className="px-3 py-2 text-sm text-font-p border rounded-md bg-surface-s">
                            {row.currentModelName || row.allowedModels[0]}
                          </div>
                        ) : (
                          <Select
                              dir="ltr"
                              value={row.currentModelName}
                              onValueChange={(val) => {
                                  selectProviderMutation.mutate({ 
                                      capability: row.capability, 
                                      provider: row.currentProviderSlug,
                                      model_id: val 
                                  });
                              }}
                              disabled={selectProviderMutation.isPending}
                          >
                              <SelectTrigger className="w-full">
                                  <SelectValue placeholder="انتخاب مدل..." />
                              </SelectTrigger>
                              <SelectContent>
                                  {row.allowedModels.map((m) => (
                                      <SelectItem key={m} value={m}>
                                          {m}
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                        )}
                    </div>

                  </div>

                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
