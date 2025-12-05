"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, List } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/elements/Accordion';
import { Switch } from '@/components/elements/Switch';
import { Badge } from '@/components/elements/Badge';
import { Label } from '@/components/elements/Label';
import { Skeleton } from '@/components/elements/Skeleton';
import { useUserPermissions } from '@/core/permissions';
import { useAISettings } from './hooks/useAISettings';
import { ProviderCard } from './components/ProviderCard';
import { aiApi } from '@/api/ai/route';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccessToast, showErrorToast } from '@/core/config/errorHandler';
import { frontendToBackendProviderMap, backendToFrontendIdMap } from './hooks/useAISettings';
import { useRouter } from 'next/navigation';


export default function AISettingsPage() {
  const router = useRouter();
  const { isSuperAdmin, hasModuleAction } = useUserPermissions();

  const hasAccess = true;
  const queryClient = useQueryClient();
  const {
    providers,
    personalSettingsMap,
    isLoadingBackendProviders,
    toggleUseSharedApiMutation,
  } = useAISettings();

  const [expandedProviders, setExpandedProviders] = useState<string[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadedApiKeys = useMemo(() => {
    if (!providers.length) {
      return {};
    }

    const keys: Record<string, string> = {};

    providers.forEach(provider => {
      const setting = personalSettingsMap[provider.id];

      if (setting?.api_key) {
        const apiKey = setting.api_key;
        if (apiKey && apiKey !== '***' && apiKey.trim() !== '') {
          keys[provider.id] = apiKey;
        }
      }
    });

    return keys;
  }, [providers, personalSettingsMap]);

  useEffect(() => {
    if (Object.keys(loadedApiKeys).length === 0) {
      return;
    }

    setApiKeys(prev => {
      const updated = { ...prev };
      let hasChanges = false;

      Object.entries(loadedApiKeys).forEach(([key, value]) => {
        if (value && value.trim() !== '' && value !== '***') {
          if (!prev[key] || prev[key].trim() === '' || prev[key] === '***') {
            updated[key] = value;
            hasChanges = true;
          }
        }
      });

      return hasChanges ? updated : prev;
    });
  }, [loadedApiKeys]);

  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) {
      return providers;
    }
    const query = searchQuery.toLowerCase().trim();
    return providers.filter(provider =>
      provider.name.toLowerCase().includes(query) ||
      provider.description.toLowerCase().includes(query) ||
      provider.id.toLowerCase().includes(query)
    );
  }, [providers, searchQuery]);

  const handleToggleUseSharedApi = (providerId: string, checked: boolean) => {
    toggleUseSharedApiMutation.mutate({
      providerId,
      useSharedApi: checked,
    });
  };

  const saveApiKeyMutation = useMutation({
    mutationFn: async ({ providerId, apiKey, useSharedApi }: { providerId: string; apiKey: string; useSharedApi: boolean }) => {
      const backendProviderName = frontendToBackendProviderMap[providerId];
      if (!backendProviderName) {
        throw new Error(`Provider '${providerId}' در backend پشتیبانی نمی‌شود`);
      }

      if (isSuperAdmin && useSharedApi) {
        const backendProvider = providers.find(p => p.id === providerId)?.backendProvider;
        if (backendProvider?.id) {
          return await aiApi.image.saveProvider({
            id: backendProvider.id,
            provider_name: backendProviderName,
            shared_api_key: apiKey,
            is_active: true,
          });
        } else {
          return await aiApi.image.saveProvider({
            provider_name: backendProviderName,
            shared_api_key: apiKey,
            is_active: true,
          });
        }
      }

      const setting = personalSettingsMap[providerId];

      const data = {
        provider_name: backendProviderName,
        api_key: apiKey,
        use_shared_api: useSharedApi,
        is_active: true,
      };

      if (setting?.id) {
        return await aiApi.personalSettings.saveMySettings({
          id: setting.id,
          ...data,
        });
      } else {
        return await aiApi.personalSettings.saveMySettings(data);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-backend-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ai-personal-settings'] });
      showSuccessToast('API key با موفقیت ذخیره شد');
      setApiKeys(prev => ({
        ...prev,
        [variables.providerId]: variables.apiKey
      }));
      setShowApiKeys(prev => ({
        ...prev,
        [variables.providerId]: false
      }));
    },
    onError: (error: any) => {
      showErrorToast(error?.message || 'خطا در ذخیره API key');
    },
  });

  const handleSaveProvider = (providerId: string) => {
    const apiKey = apiKeys[providerId] || '';
    const setting = personalSettingsMap[providerId];
    const useSharedApi = setting?.use_shared_api ?? false;

    if (!useSharedApi && !apiKey.trim()) {
      showErrorToast('لطفاً API key را وارد کنید');
      return;
    }

    saveApiKeyMutation.mutate({
      providerId,
      apiKey: apiKey.trim(),
      useSharedApi,
    });
  };

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ providerId, isActive, useSharedApi }: { providerId: string; isActive: boolean; useSharedApi: boolean }) => {
      const backendProviderName = frontendToBackendProviderMap[providerId];
      if (!backendProviderName) {
        throw new Error(`Provider '${providerId}' در backend پشتیبانی نمی‌شود`);
      }

      if (isSuperAdmin && useSharedApi) {
        const backendProvider = providers.find(p => p.id === providerId)?.backendProvider;
        if (backendProvider?.id) {
          return await aiApi.image.toggleProvider(backendProvider.id, isActive);
        } else {
          throw new Error('Provider یافت نشد');
        }
      }

      const setting = personalSettingsMap[providerId];
      const data = {
        provider_name: backendProviderName,
        is_active: isActive,
        use_shared_api: useSharedApi,
      };

      if (setting?.id) {
        return await aiApi.personalSettings.saveMySettings({
          id: setting.id,
          ...data,
        });
      } else {
        return await aiApi.personalSettings.saveMySettings(data);
      }
    },
    onMutate: async ({ providerId, isActive, useSharedApi }) => {
      await queryClient.cancelQueries({ queryKey: ['ai-personal-settings'] });
      await queryClient.cancelQueries({ queryKey: ['ai-backend-providers'] });

      const previousPersonalSettings = queryClient.getQueryData(['ai-personal-settings']);
      const previousBackendProviders = queryClient.getQueryData(['ai-backend-providers']);

      if (!isSuperAdmin || !useSharedApi) {
        queryClient.setQueryData(['ai-personal-settings'], (old: any) => {
          if (!old) return old;
          const backendProviderName = frontendToBackendProviderMap[providerId];
          if (!backendProviderName) return old;

          return old.map((setting: any) => {
            const matchesSlug = setting.provider_slug === backendProviderName;
            const matchesName = setting.provider_name === backendProviderName;

            if (matchesSlug || matchesName) {
              return { ...setting, is_active: isActive };
            }
            return setting;
          });
        });
      }

      if (isSuperAdmin && useSharedApi) {
        queryClient.setQueryData(['ai-backend-providers'], (old: any) => {
          if (!old) return old;

          return old.map((provider: any) => {
            const frontendIdFromSlug = backendToFrontendIdMap[provider.slug];
            const frontendIdFromName = backendToFrontendIdMap[provider.name];
            const matches = frontendIdFromSlug === providerId || frontendIdFromName === providerId;

            if (matches) {
              return { ...provider, is_active: isActive };
            }
            return provider;
          });
        });
      }

      return { previousPersonalSettings, previousBackendProviders };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-backend-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ai-personal-settings'] });
      showSuccessToast('وضعیت با موفقیت تغییر کرد');
    },
    onError: (error: any, variables, context) => {
      if (context?.previousPersonalSettings) {
        queryClient.setQueryData(['ai-personal-settings'], context.previousPersonalSettings);
      }
      if (context?.previousBackendProviders) {
        queryClient.setQueryData(['ai-backend-providers'], context.previousBackendProviders);
      }
      showErrorToast(error?.message || 'خطا در تغییر وضعیت');
    },
  });

  const handleToggleActive = useCallback((providerId: string, checked: boolean, useSharedApi: boolean) => {
    const finalUseSharedApi = isSuperAdmin ? useSharedApi : false;
    toggleActiveMutation.mutate({
      providerId,
      isActive: checked,
      useSharedApi: finalUseSharedApi,
    });
  }, [toggleActiveMutation, isSuperAdmin]);

  if (isLoadingBackendProviders) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">تنظیمات AI Provider</h1>
        <Button asChild>
          <Link href="/settings/ai/models">
            <List className="w-4 h-4" />
            انتخاب مدل‌ها
          </Link>
        </Button>
      </div>

      <Card className="shadow-sm border hover:shadow-lg transition-all duration-300">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-full sm:w-auto sm:min-w-[240px] sm:max-w-[320px]">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-font-s pointer-events-none" />
                <Input
                  type="text"
                  id="search-providers"
                  name="search_providers"
                  autoComplete="off"
                  placeholder="جستجو..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8 h-8 text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {filteredProviders.length > 0 ? (
        <Accordion
          type="single"
          collapsible
          value={expandedProviders[0] || ""}
          onValueChange={(value) => {
            const newExpanded = value && value.trim() !== "" ? [value] : [];
            setExpandedProviders(newExpanded);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProviders.map((provider) => {
              const isExpanded = expandedProviders.includes(provider.id);

              const setting = personalSettingsMap[provider.id];

              const backendProvider = provider.backendProvider;
              const allowNormalAdmins = backendProvider?.allow_shared_for_normal_admins ?? false;
              const hasSharedApi = backendProvider?.has_shared_api ?? backendProvider?.has_shared_api_key ?? false;

              const canUseSharedApi = isSuperAdmin || (allowNormalAdmins && hasSharedApi);

              const useSharedApi = canUseSharedApi ? (setting?.use_shared_api ?? false) : false;

              const apiKey = apiKeys[provider.id] || '';
              const hasStoredApiKey = Boolean(
                apiKey && apiKey.trim() !== '' && apiKey !== '***'
              );

              const showApiKey = showApiKeys[provider.id] || false;

              let isActive = false;
              if (useSharedApi && isSuperAdmin) {
                isActive = provider.backendProvider?.is_active || false;
              } else {
                const setting = personalSettingsMap[provider.id];
                isActive = setting?.is_active || false;
              }

              let accessStatus = 'no-access';
              let accessLabel = 'بدون دسترسی';

              if (isActive) {
                if (useSharedApi && isSuperAdmin && hasStoredApiKey) {
                  accessStatus = 'shared';
                  accessLabel = 'API مشترک';
                } else if (!useSharedApi && hasStoredApiKey) {
                  accessStatus = 'personal';
                  accessLabel = 'API شخصی';
                } else if (useSharedApi && !isSuperAdmin && hasStoredApiKey) {
                  accessStatus = 'personal';
                  accessLabel = 'API شخصی';
                } else {
                  accessStatus = 'no-key';
                  accessLabel = 'نیاز به API Key';
                }
              } else {
                accessStatus = 'disabled';
                accessLabel = '';
              }

              return (
                <div key={provider.id} className="space-y-0">
                  <AccordionItem value={provider.id} className="border-none">
                    <Card className={`${isExpanded ? 'border-primary shadow-md' : 'hover:border-br'} transition-all duration-200 !py-0 !gap-0`}>
                      <AccordionTrigger className="!px-6 !pt-6 !pb-4 !no-underline hover:no-underline [&>svg]:hidden cursor-pointer">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-2xl">{provider.icon}</span>
                            <div className="text-right flex-1">
                              <h3 className="text-lg font-semibold text-font-p">{provider.name}</h3>
                              <p className="text-sm text-font-s">{provider.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={isActive ? "green" : "gray"}
                              className="text-xs"
                            >
                              {isActive ? 'فعال' : 'غیرفعال'}
                            </Badge>
                            {isActive && accessLabel && (
                              <Badge
                                variant={
                                  accessStatus === 'shared' ? 'default' :
                                    accessStatus === 'personal' ? 'green' :
                                      accessStatus === 'no-key' ? 'amber' :
                                        'gray'
                                }
                                className="text-xs"
                              >
                                {accessLabel}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {provider.models.length} مدل
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent>
                        <ProviderCard
                          provider={provider}
                          isExpanded={isExpanded}
                          apiKey={apiKey}
                          showApiKey={showApiKey}
                          useSharedApi={useSharedApi}
                          hasStoredApiKey={hasStoredApiKey}
                          isSaving={saveApiKeyMutation.isPending || toggleActiveMutation.isPending}
                          isSuperAdmin={isSuperAdmin}
                          allowNormalAdmins={allowNormalAdmins}
                          hasSharedApi={hasSharedApi}
                          canUseSharedApi={canUseSharedApi}
                          onToggleApiKeyVisibility={() => {
                            setShowApiKeys(prev => ({
                              ...prev,
                              [provider.id]: !prev[provider.id]
                            }));
                          }}
                          onApiKeyChange={(value) => {
                            setApiKeys(prev => ({
                              ...prev,
                              [provider.id]: value
                            }));
                          }}
                          onToggleUseSharedApi={(checked) => {
                            handleToggleUseSharedApi(provider.id, checked);
                          }}
                          onSave={() => handleSaveProvider(provider.id)}
                          isActive={isActive}
                          onToggleActive={(checked) => {
                            if (toggleActiveMutation.isPending) return;
                            const currentSetting = personalSettingsMap[provider.id];
                            handleToggleActive(provider.id, checked, useSharedApi);
                          }}
                        />
                      </AccordionContent>
                    </Card>
                  </AccordionItem>
                </div>
              );
            })}
          </div>
        </Accordion>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-font-s">
              هیچ provider ای یافت نشد. لطفاً جستجوی خود را تغییر دهید.
            </p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}