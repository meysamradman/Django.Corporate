"use client";

/**
 * صفحه تنظیمات AI Provider ها
 * 
 * این صفحه برای مدیریت:
 * - API Keys مشترک (فقط سوپر ادمین)
 * - تنظیمات شخصی هر ادمین
 * - انتخاب مدل‌های OpenRouter
 */

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Settings, Search, Power } from 'lucide-react';
import { Card, CardContent } from '@/components/elements/Card';
import { Input } from '@/components/elements/Input';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/elements/Accordion';
import { Switch } from '@/components/elements/Switch';
import { Badge } from '@/components/elements/Badge';
import { Label } from '@/components/elements/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/elements/Dialog';
import { Button } from '@/components/elements/Button';
import { Skeleton } from '@/components/elements/Skeleton';
import { useUserPermissions } from '@/core/permissions';
import { useAISettings } from './hooks/useAISettings';
import { AdminAccessSettings } from './components/AdminAccessSettings';
import { ProviderCard } from './components/ProviderCard';
import { aiApi } from '@/api/ai/route';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccessToast, showErrorToast } from '@/core/config/errorHandler';
import { frontendToBackendProviderMap } from './hooks/useAISettings';

// Dynamic import برای OpenRouterModelSelector
const OpenRouterModelSelectorContent = lazy(() => 
  import('./OpenRouterModelSelector').then(module => ({ default: module.OpenRouterModelSelectorContent }))
);

// Dynamic import برای HuggingFaceModelSelector
const HuggingFaceModelSelectorContent = lazy(() => 
  import('./HuggingFaceModelSelector').then(module => ({ default: module.HuggingFaceModelSelectorContent }))
);

export default function AISettingsPage() {
  const { isSuperAdmin } = useUserPermissions();
  const queryClient = useQueryClient();
  const {
    providers,
    personalSettingsMap,
    isLoadingBackendProviders,
    toggleUseSharedApiMutation,
    getUseSharedApi,
  } = useAISettings();

  const [expandedProviders, setExpandedProviders] = useState<string[]>([]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedProviderForModels, setSelectedProviderForModels] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  // Load API keys from backend providers and personal settings
  useEffect(() => {
    const loadedApiKeys: Record<string, string> = {};
    
    // Load from shared providers (for super admin)
    if (isSuperAdmin) {
      providers.forEach(provider => {
        if (provider.backendProvider?.api_key) {
          loadedApiKeys[provider.id] = provider.backendProvider.api_key;
        }
      });
    }
    
    // Load from personal settings
    Object.entries(personalSettingsMap).forEach(([providerId, setting]) => {
      if (setting.api_key && !setting.use_shared_api) {
        loadedApiKeys[providerId] = setting.api_key;
      }
    });
    
    setApiKeys(prev => ({ ...prev, ...loadedApiKeys }));
  }, [providers, personalSettingsMap, isSuperAdmin]);

  // استفاده مستقیم از providers - بدون فیلتر
  const filteredProviders = providers;

  const handleToggleUseSharedApi = (providerId: string, checked: boolean) => {
    toggleUseSharedApiMutation.mutate({
      providerId,
      useSharedApi: checked,
    });
  };

  const handleOpenModelSelector = (providerId: string) => {
    setSelectedProviderForModels(providerId);
    setShowModelSelector(true);
  };

  const handleCloseModelSelector = () => {
    setShowModelSelector(false);
    setSelectedProviderForModels(null);
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
          // Update shared provider
          return await aiApi.image.saveProvider({
            id: backendProvider.id,
            provider_name: backendProviderName,
            api_key: apiKey,
            is_active: true,
          });
        } else {
          // Create new shared provider
          return await aiApi.image.saveProvider({
            provider_name: backendProviderName,
            api_key: apiKey,
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
      // بستن باکس بعد از ذخیره موفق
      setExpandedProviders(prev => prev.filter(id => id !== variables.providerId));
      // API key را در state نگه دار تا بتواند نمایش داده شود (برای نمایش بخشی از آن)
      // API key که ذخیره شده در state می‌ماند تا بتوانیم بخشی از آن را نمایش بدهیم
      // مخفی کردن نمایش API key بعد از ذخیره
      setShowApiKeys(prev => ({
        ...prev,
        [variables.providerId]: false
      }));
      // API key در state می‌ماند تا بتوانیم بخشی از آن را نمایش بدهیم
    },
    onError: (error: any) => {
      showErrorToast(error?.message || 'خطا در ذخیره API key');
    },
  });

  const handleSaveProvider = (providerId: string) => {
    const apiKey = apiKeys[providerId] || '';
    const useSharedApi = getUseSharedApi(providerId);

    if (!apiKey.trim()) {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-backend-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ai-personal-settings'] });
      showSuccessToast('وضعیت با موفقیت تغییر کرد');
    },
    onError: (error: any) => {
      showErrorToast(error?.message || 'خطا در تغییر وضعیت');
    },
  });

  const handleToggleActive = (providerId: string, checked: boolean, useSharedApi: boolean) => {
    toggleActiveMutation.mutate({
      providerId,
      isActive: checked,
      useSharedApi,
    });
  };

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
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-font-p">تنظیمات AI Provider</h1>
        </div>
        <p className="text-font-s text-sm">
          {providers.length} provider
        </p>
      </div>

      {/* Admin Access Settings - فقط برای سوپر ادمین */}
      {isSuperAdmin && (
        <AdminAccessSettings isSuperAdmin={isSuperAdmin} />
      )}

      {/* Search Bar - REMOVED FOR TESTING */}

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
              const useSharedApi = getUseSharedApi(provider.id);
              
              // دریافت API key بر اساس نوع (مشترک یا شخصی) - بهینه شده
              let apiKey = '';
              let hasStoredApiKey = false;
              
              // اول از state بگیر (اگر وجود دارد - یعنی بعد از ذخیره در state مانده)
              if (apiKeys[provider.id] && apiKeys[provider.id].trim() !== '') {
                apiKey = apiKeys[provider.id];
                hasStoredApiKey = true;
              } else if (useSharedApi && isSuperAdmin) {
                // از shared provider بگیر
                const backendProvider = provider.backendProvider;
                if (backendProvider?.api_key) {
                  hasStoredApiKey = true;
                  if (backendProvider.api_key !== '***') {
                    apiKey = backendProvider.api_key;
                  }
                }
              } else {
                // از personal settings بگیر
                const setting = personalSettingsMap[provider.id];
                if (setting?.api_key) {
                  hasStoredApiKey = true;
                  if (setting.api_key !== '***') {
                    apiKey = setting.api_key;
                  }
                }
              }
              
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
                          <Badge variant="outline" className="ml-2">
                            {provider.models.length} مدل
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      
                      {/* Toggle Active Button - همیشه دیده می‌شود */}
                      <div className="px-6 pb-4 border-b border-br">
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-bg/40 to-bg/20 rounded-lg border border-br hover:border-primary/20 transition-all">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-md ${isActive ? 'bg-green/20' : 'bg-gray/20'}`}>
                              <Power className={`h-4 w-4 ${isActive ? 'text-green-1' : 'text-font-s'}`} />
                            </div>
                            <div>
                              <Label className="text-sm font-semibold cursor-pointer text-font-p">
                                وضعیت فعال/غیرفعال
                              </Label>
                              <p className="text-xs text-font-s mt-0.5">
                                {isActive ? 'Provider در دسترس است' : 'Provider غیرفعال است'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={isActive}
                              onCheckedChange={(checked) => handleToggleActive(provider.id, checked, useSharedApi)}
                              disabled={toggleActiveMutation.isPending || saveApiKeyMutation.isPending}
                            />
                            <Badge variant={isActive ? "green" : "gray"} className="min-w-[70px] text-center font-medium">
                              {isActive ? 'فعال' : 'غیرفعال'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <AccordionContent>
                        <ProviderCard
                          provider={provider}
                          isExpanded={isExpanded}
                          apiKey={apiKey}
                          showApiKey={showApiKey}
                          useSharedApi={useSharedApi}
                          hasStoredApiKey={hasStoredApiKey}
                          isSaving={saveApiKeyMutation.isPending}
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
                          onToggleUseSharedApi={(checked) => handleToggleUseSharedApi(provider.id, checked)}
                          onOpenModelSelector={() => handleOpenModelSelector(provider.id)}
                          onSave={() => handleSaveProvider(provider.id)}
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


      {/* OpenRouter Model Selector Modal */}
      <Dialog open={showModelSelector} onOpenChange={(open) => !open && handleCloseModelSelector()}>
        <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-br flex-shrink-0">
            <DialogTitle className="flex items-center gap-3 text-font-p">
              <Settings className="w-6 h-6 text-primary" />
              انتخاب مدل‌ها
            </DialogTitle>
            <DialogDescription className="text-font-s">
              مدل‌های مورد نظر خود را انتخاب کنید
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 min-h-0">
            {selectedProviderForModels && (
              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                {selectedProviderForModels === 'openrouter' ? (
                  <OpenRouterModelSelectorContent
                    providerId={selectedProviderForModels || ''}
                    providerName={providers.find(p => p.id === selectedProviderForModels)?.name || 'OpenRouter'}
                    onSave={() => {}}
                    onSelectionChange={() => {}}
                  />
                ) : selectedProviderForModels === 'huggingface' ? (
                  <HuggingFaceModelSelectorContent
                    providerId={selectedProviderForModels || ''}
                    providerName={providers.find(p => p.id === selectedProviderForModels)?.name || 'Hugging Face'}
                    onSave={() => {}}
                    onSelectionChange={() => {}}
                  />
                ) : null}
              </Suspense>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-br flex-shrink-0">
            <Button variant="outline" onClick={handleCloseModelSelector}>
              بستن
            </Button>
            <Button onClick={handleCloseModelSelector}>
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

