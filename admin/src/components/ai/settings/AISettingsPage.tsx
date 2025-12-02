"use client";

/**
 * صفحه تنظیمات AI Provider ها
 * 
 * این صفحه برای مدیریت:
 * - API Keys مشترک (فقط سوپر ادمین)
 * - تنظیمات شخصی هر ادمین
 * - انتخاب مدل‌های OpenRouter
 */

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

  // ✅ Permission check: همه ادمین‌ها می‌توانند این صفحه را ببینند
  // اگر سوپر ادمین provider را فعال کند، برای همه ادمین‌ها قابل مشاهده است
  // فقط برای ایجاد/ویرایش نیاز به ai.manage است
  const hasAccess = true; // ✅ همه ادمین‌ها می‌توانند provider های فعال را ببینند
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

  // ✅ Load API keys from personal settings (which now includes api_key from serializer)
  // بهینه شده: استفاده از useMemo برای جلوگیری از re-render های اضافی
  const loadedApiKeys = useMemo(() => {
    if (!providers.length) {
      return {};
    }

    const keys: Record<string, string> = {};

    providers.forEach(provider => {
      const setting = personalSettingsMap[provider.id];

      // ✅ از personalSettingsMap استفاده کن که api_key دارد (از serializer جدید)
      if (setting?.api_key) {
        const apiKey = setting.api_key;
        // ✅ فقط اگر API key معتبر است (نه '***' و نه خالی)
        if (apiKey && apiKey !== '***' && apiKey.trim() !== '') {
          keys[provider.id] = apiKey;
        }
      }
    });

    return keys;
  }, [providers, personalSettingsMap]);

  // ✅ فقط یکبار API keys را در state set کن (بهینه شده)
  useEffect(() => {
    if (Object.keys(loadedApiKeys).length === 0) {
      return;
    }

    setApiKeys(prev => {
      const updated = { ...prev };
      let hasChanges = false;

      // ✅ فقط API key هایی که در state نیستند یا خالی هستند را set کن
      Object.entries(loadedApiKeys).forEach(([key, value]) => {
        if (value && value.trim() !== '' && value !== '***') {
          // ✅ فقط اگر در state نیست یا خالی است، set کن
          if (!prev[key] || prev[key].trim() === '' || prev[key] === '***') {
            updated[key] = value;
            hasChanges = true;
          }
        }
      });

      // ✅ فقط اگر تغییری وجود دارد، state را update کن
      return hasChanges ? updated : prev;
    });
  }, [loadedApiKeys]);

  // ✅ فیلتر کردن providers بر اساس جستجو
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
    // ✅ این تابع برای همه (سوپر ادمین و ادمین معمولی) قابل استفاده است
    // ✅ چک canUseSharedApi در ProviderCard انجام شده است
    toggleUseSharedApiMutation.mutate({
      providerId,
      useSharedApi: checked,
    });
  };


  // Mutation برای ذخیره API key
  const saveApiKeyMutation = useMutation({
    mutationFn: async ({ providerId, apiKey, useSharedApi }: { providerId: string; apiKey: string; useSharedApi: boolean }) => {
      const backendProviderName = frontendToBackendProviderMap[providerId];
      if (!backendProviderName) {
        throw new Error(`Provider '${providerId}' در backend پشتیبانی نمی‌شود`);
      }

      // اگر سوپر ادمین و useSharedApi=true باشد، به shared API ذخیره می‌کنیم
      if (isSuperAdmin && useSharedApi) {
        const backendProvider = providers.find(p => p.id === providerId)?.backendProvider;
        if (backendProvider?.id) {
          // Update shared provider - استفاده از shared_api_key به جای api_key
          return await aiApi.image.saveProvider({
            id: backendProvider.id,
            provider_name: backendProviderName,
            shared_api_key: apiKey, // ✅ تغییر از api_key به shared_api_key
            is_active: true,
          });
        } else {
          // Create new shared provider - استفاده از shared_api_key به جای api_key
          return await aiApi.image.saveProvider({
            provider_name: backendProviderName,
            shared_api_key: apiKey, // ✅ تغییر از api_key به shared_api_key
            is_active: true,
          });
        }
      }

      // در غیر این صورت به Personal Settings ذخیره می‌کنیم
      // (چه useSharedApi=true باشد و چه false - در هر دو حالت به personal settings ذخیره می‌شود)
      const setting = personalSettingsMap[providerId];

      const data = {
        provider_name: backendProviderName,
        api_key: apiKey,
        use_shared_api: useSharedApi,
        is_active: true,
      };

      if (setting?.id) {
        // Update existing personal setting
        return await aiApi.personalSettings.saveMySettings({
          id: setting.id,
          ...data,
        });
      } else {
        // Create new personal setting
        return await aiApi.personalSettings.saveMySettings(data);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-backend-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ai-personal-settings'] });
      showSuccessToast('API key با موفقیت ذخیره شد');
      // ✅ API key را در state نگه دار تا بعد از ذخیره نمایش داده شود
      // API key که ذخیره شده در state می‌ماند تا بتوانیم بخشی از آن را نمایش بدهیم
      setApiKeys(prev => ({
        ...prev,
        [variables.providerId]: variables.apiKey  // ✅ نگه داشتن API key در state
      }));
      // مخفی کردن نمایش API key بعد از ذخیره
      setShowApiKeys(prev => ({
        ...prev,
        [variables.providerId]: false
      }));
      // بستن باکس بعد از ذخیره موفق (اختیاری - می‌توانیم باز بگذاریم)
      // setExpandedProviders(prev => prev.filter(id => id !== variables.providerId));
    },
    onError: (error: any) => {
      showErrorToast(error?.message || 'خطا در ذخیره API key');
    },
  });

  const handleSaveProvider = (providerId: string) => {
    const apiKey = apiKeys[providerId] || '';
    // استفاده از personalSettingsMap برای گرفتن useSharedApi
    const setting = personalSettingsMap[providerId];
    const useSharedApi = setting?.use_shared_api ?? false;

    // ✅ اگر useSharedApi=true است، نیازی به API key نیست
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

  // Mutation برای toggle کردن وضعیت فعال/غیرفعال
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ providerId, isActive, useSharedApi }: { providerId: string; isActive: boolean; useSharedApi: boolean }) => {
      const backendProviderName = frontendToBackendProviderMap[providerId];
      if (!backendProviderName) {
        throw new Error(`Provider '${providerId}' در backend پشتیبانی نمی‌شود`);
      }

      // اگر سوپر ادمین و useSharedApi=true باشد، shared provider را toggle می‌کنیم
      if (isSuperAdmin && useSharedApi) {
        const backendProvider = providers.find(p => p.id === providerId)?.backendProvider;
        if (backendProvider?.id) {
          return await aiApi.image.toggleProvider(backendProvider.id, isActive);
        } else {
          throw new Error('Provider یافت نشد');
        }
      }

      // در غیر این صورت personal settings را toggle می‌کنیم
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
      // ✅ Optimistic Update: فوراً state رو به‌روز کن
      await queryClient.cancelQueries({ queryKey: ['ai-personal-settings'] });
      await queryClient.cancelQueries({ queryKey: ['ai-backend-providers'] });

      // Snapshot برای rollback در صورت خطا
      const previousPersonalSettings = queryClient.getQueryData(['ai-personal-settings']);
      const previousBackendProviders = queryClient.getQueryData(['ai-backend-providers']);

      // Optimistic update برای personal settings
      if (!isSuperAdmin || !useSharedApi) {
        queryClient.setQueryData(['ai-personal-settings'], (old: any) => {
          if (!old) return old;
          const backendProviderName = frontendToBackendProviderMap[providerId];
          if (!backendProviderName) return old;

          return old.map((setting: any) => {
            // ✅ دقیق‌ترین match: اول provider_slug (دقیق‌ترین)، سپس provider_name
            const matchesSlug = setting.provider_slug === backendProviderName;
            const matchesName = setting.provider_name === backendProviderName;

            // فقط اگر دقیقاً match کرد، به‌روزرسانی کن
            if (matchesSlug || matchesName) {
              return { ...setting, is_active: isActive };
            }
            return setting;
          });
        });
      }

      // Optimistic update برای backend providers (اگر سوپر ادمین و shared)
      if (isSuperAdmin && useSharedApi) {
        queryClient.setQueryData(['ai-backend-providers'], (old: any) => {
          if (!old) return old;

          return old.map((provider: any) => {
            // ✅ دقیق‌ترین match: اول slug، سپس name
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
      // Refetch برای اطمینان از sync با backend
      queryClient.invalidateQueries({ queryKey: ['ai-backend-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ai-personal-settings'] });
      showSuccessToast('وضعیت با موفقیت تغییر کرد');
    },
    onError: (error: any, variables, context) => {
      // Rollback در صورت خطا
      if (context?.previousPersonalSettings) {
        queryClient.setQueryData(['ai-personal-settings'], context.previousPersonalSettings);
      }
      if (context?.previousBackendProviders) {
        queryClient.setQueryData(['ai-backend-providers'], context.previousBackendProviders);
      }
      showErrorToast(error?.message || 'خطا در تغییر وضعیت');
    },
  });

  // ✅ بهینه‌سازی: استفاده از useCallback برای جلوگیری از re-render
  const handleToggleActive = useCallback((providerId: string, checked: boolean, useSharedApi: boolean) => {
    // ✅ برای ادمین معمولی: همیشه useSharedApi = false
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">تنظیمات AI Provider</h1>
        <Button asChild>
          <Link href="/settings/ai/models">
            <List className="w-4 h-4" />
            انتخاب مدل‌ها
          </Link>
        </Button>
      </div>

      {/* Admin Access Settings - REMOVED - Global Control حالا داخل هر provider card هست */}

      {/* Search Bar - مثل DataTable در Card */}
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

      {/* Providers List */}
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

              // استفاده از personalSettingsMap برای گرفتن useSharedApi
              const setting = personalSettingsMap[provider.id];

              // ✅ بررسی اینکه آیا ادمین معمولی می‌تواند از API مشترک استفاده کند
              const backendProvider = provider.backendProvider;
              const allowNormalAdmins = backendProvider?.allow_shared_for_normal_admins ?? false;
              // ✅ Backend می‌فرستد: has_shared_api (نه has_shared_api_key)
              const hasSharedApi = backendProvider?.has_shared_api ?? backendProvider?.has_shared_api_key ?? false;

              // ✅ سوپر ادمین: همیشه می‌تواند Switch را ببیند و از API مشترک استفاده کند
              // ✅ ادمین معمولی: فقط اگر allowNormalAdmins=true و hasSharedApi=true باشد، می‌تواند Switch را ببیند
              const canUseSharedApi = isSuperAdmin || (allowNormalAdmins && hasSharedApi);


              // ✅ محاسبه useSharedApi: اگر canUseSharedApi باشد، از setting استفاده کن، در غیر این صورت false
              // ✅ برای ادمین معمولی که نمی‌تواند از API مشترک استفاده کند، همیشه false
              const useSharedApi = canUseSharedApi ? (setting?.use_shared_api ?? false) : false;

              // ✅ دریافت API key بر اساس نوع (مشترک یا شخصی) - بهینه شده
              // استفاده از useMemo برای جلوگیری از re-render های اضافی
              const apiKey = apiKeys[provider.id] || '';
              const hasStoredApiKey = Boolean(
                apiKey && apiKey.trim() !== '' && apiKey !== '***'
              );

              const showApiKey = showApiKeys[provider.id] || false;

              // دریافت وضعیت فعال/غیرفعال
              let isActive = false;
              if (useSharedApi && isSuperAdmin) {
                // از shared provider بگیر
                isActive = provider.backendProvider?.is_active || false;
              } else {
                // از personal settings بگیر
                const setting = personalSettingsMap[provider.id];
                isActive = setting?.is_active || false;
              }

              // ✅ محاسبه وضعیت دسترسی (برای Badge)
              let accessStatus = 'no-access';
              let accessLabel = 'بدون دسترسی';

              // ✅ فقط اگر فعال باشه، وضعیت دسترسی رو نمایش بده
              if (isActive) {
                if (useSharedApi && isSuperAdmin && hasStoredApiKey) {
                  // ✅ مشترک: فقط اگر super admin است و API key دارد
                  accessStatus = 'shared';
                  accessLabel = 'API مشترک';
                } else if (!useSharedApi && hasStoredApiKey) {
                  // ✅ شخصی: اگر useSharedApi=false و API key دارد
                  accessStatus = 'personal';
                  accessLabel = 'API شخصی';
                } else if (useSharedApi && !isSuperAdmin && hasStoredApiKey) {
                  // ✅ اگر useSharedApi=true اما super admin نیست و API key دارد، از personal استفاده می‌کند
                  accessStatus = 'personal';
                  accessLabel = 'API شخصی';
                } else {
                  // ✅ فقط اگر API key ندارد
                  accessStatus = 'no-key';
                  accessLabel = 'نیاز به API Key';
                }
              } else {
                // غیرفعال - فقط یک Badge نمایش می‌دهیم
                accessStatus = 'disabled';
                accessLabel = ''; // خالی - چون Badge اول نشون میده
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
                            {/* ✅ فقط اگر فعال باشه، Badge دسترسی رو نشون بده */}
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
                            // ✅ اگر canUseSharedApi باشد، می‌تواند Switch را تغییر دهد
                            // ✅ این برای سوپر ادمین و ادمین معمولی (با شرایط) کار می‌کند
                            handleToggleUseSharedApi(provider.id, checked);
                          }}
                          onSave={() => handleSaveProvider(provider.id)}
                          isActive={isActive}
                          onToggleActive={(checked) => {
                            // ✅ اطمینان از اینکه useSharedApi به‌روز است و جلوگیری از تداخل
                            if (toggleActiveMutation.isPending) return; // جلوگیری از تداخل
                            const currentSetting = personalSettingsMap[provider.id];
                            // ✅ استفاده از useSharedApi که قبلاً محاسبه شده
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