"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/elements/Card';
import { Accordion } from '@/components/elements/Accordion';
import { Skeleton } from '@/components/elements/Skeleton';
import { useUserPermissions } from '@/core/permissions';
import { useAISettings } from './hooks/useAISettings';
import { useProviderActions } from './hooks/useProviderActions';
import { AISettingsHeader } from './components/AISettingsHeader';
import { ProviderAccordionItem } from './components/ProviderAccordionItem';

export default function AISettingsPage() {
  const { isSuperAdmin } = useUserPermissions();
  const {
    providers,
    personalSettingsMap,
    isLoadingBackendProviders,
    toggleUseSharedApiMutation,
  } = useAISettings();

  const {
    personalApiKeys,
    sharedApiKeys,
    setPersonalApiKeys,
    setSharedApiKeys,
    showApiKeys,
    setShowApiKeys,
    saveApiKeyMutation,
    toggleActiveMutation,
    handleSaveProvider,
    handleToggleActive,
  } = useProviderActions({ providers, personalSettingsMap, isSuperAdmin });

  const [expandedProviders, setExpandedProviders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPersonalApiKeys, setShowPersonalApiKeys] = useState<Record<string, boolean>>({});
  const [showSharedApiKeys, setShowSharedApiKeys] = useState<Record<string, boolean>>({});

  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) return providers;
    const query = searchQuery.toLowerCase().trim();
    return providers.filter(provider =>
      provider.name.toLowerCase().includes(query) ||
      provider.description.toLowerCase().includes(query) ||
      provider.id.toLowerCase().includes(query)
    );
  }, [providers, searchQuery]);

  const handleToggleUseSharedApi = (providerId: string, checked: boolean) => {
    toggleUseSharedApiMutation.mutate({ providerId, useSharedApi: checked });
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
      <AISettingsHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

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
              
              const personalApiKey = personalApiKeys[provider.id] || '';
              const sharedApiKey = sharedApiKeys[provider.id] || '';
              const apiKey = useSharedApi && isSuperAdmin 
                ? sharedApiKey
                : personalApiKey;
              
              const hasStoredApiKey = Boolean(apiKey && apiKey.trim() !== '' && apiKey !== '***');
              const hasStoredPersonalApiKey = Boolean(personalApiKey && personalApiKey.trim() !== '' && personalApiKey !== '***');
              const hasStoredSharedApiKey = Boolean(sharedApiKey && sharedApiKey.trim() !== '' && sharedApiKey !== '***');
              const showApiKey = showApiKeys[provider.id] || false;
              const showPersonalApiKey = showPersonalApiKeys[provider.id] || false;
              const showSharedApiKey = showSharedApiKeys[provider.id] || false;

              let isActive = false;
              if (useSharedApi && isSuperAdmin) {
                isActive = provider.backendProvider?.is_active || false;
              } else {
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
                <ProviderAccordionItem
                  key={provider.id}
                  provider={provider}
                  isExpanded={isExpanded}
                  apiKey={apiKey}
                  showApiKey={showApiKey}
                  useSharedApi={useSharedApi}
                  hasStoredApiKey={hasStoredApiKey}
                  personalApiKey={personalApiKey}
                  sharedApiKey={sharedApiKey}
                  hasStoredPersonalApiKey={hasStoredPersonalApiKey}
                  hasStoredSharedApiKey={hasStoredSharedApiKey}
                  showPersonalApiKey={showPersonalApiKey}
                  showSharedApiKey={showSharedApiKey}
                  isSaving={saveApiKeyMutation.isPending || toggleActiveMutation.isPending}
                  isSuperAdmin={isSuperAdmin}
                  allowNormalAdmins={allowNormalAdmins}
                  hasSharedApi={hasSharedApi}
                  canUseSharedApi={canUseSharedApi}
                  isActive={isActive}
                  accessStatus={accessStatus}
                  accessLabel={accessLabel}
                  personalSettingsMap={personalSettingsMap}
                  onToggleApiKeyVisibility={() => {
                    setShowApiKeys(prev => ({
                      ...prev,
                      [provider.id]: !prev[provider.id]
                    }));
                  }}
                  onApiKeyChange={(value) => {
                    if (useSharedApi && isSuperAdmin) {
                      setSharedApiKeys(prev => ({
                        ...prev,
                        [provider.id]: value
                      }));
                    } else {
                      setPersonalApiKeys(prev => ({
                        ...prev,
                        [provider.id]: value
                      }));
                    }
                  }}
                  onPersonalApiKeyChange={(value) => {
                    setPersonalApiKeys(prev => ({
                      ...prev,
                      [provider.id]: value
                    }));
                  }}
                  onSharedApiKeyChange={(value) => {
                    setSharedApiKeys(prev => ({
                      ...prev,
                      [provider.id]: value
                    }));
                  }}
                  onTogglePersonalApiKeyVisibility={() => {
                    setShowPersonalApiKeys(prev => ({
                      ...prev,
                      [provider.id]: !prev[provider.id]
                    }));
                  }}
                  onToggleSharedApiKeyVisibility={() => {
                    setShowSharedApiKeys(prev => ({
                      ...prev,
                      [provider.id]: !prev[provider.id]
                    }));
                  }}
                  onToggleUseSharedApi={(checked) => {
                    handleToggleUseSharedApi(provider.id, checked);
                  }}
                  onSave={(apiKeyValue) => handleSaveProvider(provider.id, useSharedApi, apiKeyValue)}
                  onSavePersonal={(apiKeyValue) => handleSaveProvider(provider.id, false, apiKeyValue)}
                  onSaveShared={(apiKeyValue) => handleSaveProvider(provider.id, true, apiKeyValue)}
                  onDeletePersonal={() => {
                    // پاک کردن از state
                    setPersonalApiKeys(prev => {
                      const newKeys = { ...prev };
                      newKeys[provider.id] = '';
                      return newKeys;
                    });
                    // ارسال string خالی به backend برای حذف کامل
                    saveApiKeyMutation.mutate({
                      providerId: provider.id,
                      apiKey: '',
                      useSharedApi: false,
                    });
                  }}
                  onDeleteShared={() => {
                    // پاک کردن از state
                    setSharedApiKeys(prev => {
                      const newKeys = { ...prev };
                      newKeys[provider.id] = '';
                      return newKeys;
                    });
                    // ارسال string خالی به backend برای حذف کامل
                    saveApiKeyMutation.mutate({
                      providerId: provider.id,
                      apiKey: '',
                      useSharedApi: true,
                    });
                  }}
                  onToggleActive={(checked) => {
                    if (toggleActiveMutation.isPending) return;
                    handleToggleActive(provider.id, checked, useSharedApi);
                  }}
                />
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