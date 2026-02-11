import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Save, Check } from 'lucide-react';

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
    staleTime: 0, // Always fetch fresh
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

  useEffect(() => {
    if (!isAuthLoading && !hasAccess) {
      showError('این صفحه فقط برای سوپر ادمین‌ها قابل دسترسی است');
      navigate('/ai/settings', { replace: true });
    }
  }, [isAuthLoading, hasAccess, navigate]);

  // Mutation to change provider
  const selectProviderMutation = useMutation({
    mutationFn: async ({ capability, provider }: { capability: AICapability; provider: string }) => {
      return aiApi.models.selectModel({ capability, provider }); // In backend this acts as select-provider
    },
    onSuccess: (_, { capability }) => {
      showSuccess(`ارائه‌دهنده ${capability} با موفقیت تغییر کرد`);
      queryClient.invalidateQueries({ queryKey: ['ai-active-capabilities'] });
    },
    onError: (err) => {
      showError('خطا در تغییر ارائه‌دهنده');
      console.error(err);
    },
  });

  const isLoading = isActiveLoading || isProvidersLoading;

  const handleProviderChange = (capability: AICapability, providerSlug: string) => {
    selectProviderMutation.mutate({ capability, provider: providerSlug });
  };

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
      
      // Map to consistent format
      const options: ProviderOption[] = availableProviders.map((p) => ({
        slug: p.slug,
        name: p.display_name,
      }));

      return {
        ...item,
        isActive: Boolean(cm?.is_active),
        currentProviderSlug: cm?.provider_slug || '',
        currentModelName: cm?.model_id || '—',
        options,
      };
    });
  }, [activeData, providersData]);

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <Card className="shadow-sm border">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-pink">
              <Sparkles className="w-5 h-5 text-pink-2" />
            </div>
            <div>
              <div>AI Settings (Provider Selection)</div>
              <p className="text-sm font-normal text-font-s mt-1">
                ارائه‌دهنده (Provider) مورد نظر را انتخاب کنید. مدل به‌صورت خودکار (Hardcoded) انتخاب می‌شود.
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
                  <div className="flex items-center gap-3 min-w-[150px]">
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

                  {/* Right: Provider Select */}
                  <div className="flex items-center gap-3 flex-1 justify-end max-w-md w-full">
                    <div className="w-full">
                      <Select
                        dir="rtl"
                        value={row.currentProviderSlug}
                        onValueChange={(val) => handleProviderChange(row.capability, val)}
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
