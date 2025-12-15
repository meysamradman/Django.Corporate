"use client";

import React from 'react';
import { Card } from '@/components/elements/Card';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/elements/Accordion';
import { Badge } from '@/components/elements/Badge';
import { ProviderCard } from './ProviderCard';

interface Provider {
  id: string;
  name: string;
  icon: string;
  description: string;
  apiKeyLabel: string;
  models: any[];
  backendProvider?: any;
}

interface ProviderAccordionItemProps {
  provider: Provider;
  isExpanded: boolean;
  apiKey: string;
  showApiKey: boolean;
  useSharedApi: boolean;
  hasStoredApiKey: boolean;
  personalApiKey?: string;
  sharedApiKey?: string;
  hasStoredPersonalApiKey?: boolean;
  hasStoredSharedApiKey?: boolean;
  showPersonalApiKey?: boolean;
  showSharedApiKey?: boolean;
  isSaving: boolean;
  isSuperAdmin: boolean;
  allowNormalAdmins: boolean;
  hasSharedApi: boolean;
  canUseSharedApi: boolean;
  isActive: boolean;
  accessStatus: string;
  accessLabel: string;
  personalSettingsMap: Record<string, any>;
  onToggleApiKeyVisibility: () => void;
  onApiKeyChange: (value: string) => void;
  onPersonalApiKeyChange?: (value: string) => void;
  onSharedApiKeyChange?: (value: string) => void;
  onTogglePersonalApiKeyVisibility?: () => void;
  onToggleSharedApiKeyVisibility?: () => void;
  onToggleUseSharedApi: (checked: boolean) => void;
  onSave: () => void;
  onSavePersonal?: () => void;
  onSaveShared?: () => void;
  onDeletePersonal?: () => void;
  onDeleteShared?: () => void;
  onToggleActive: (checked: boolean) => void;
}

export function ProviderAccordionItem({
  provider,
  isExpanded,
  apiKey,
  showApiKey,
  useSharedApi,
  hasStoredApiKey,
  personalApiKey,
  sharedApiKey,
  hasStoredPersonalApiKey,
  hasStoredSharedApiKey,
  showPersonalApiKey,
  showSharedApiKey,
  isSaving,
  isSuperAdmin,
  allowNormalAdmins,
  hasSharedApi,
  canUseSharedApi,
  isActive,
  accessStatus,
  accessLabel,
  personalSettingsMap,
  onToggleApiKeyVisibility,
  onApiKeyChange,
  onPersonalApiKeyChange,
  onSharedApiKeyChange,
  onTogglePersonalApiKeyVisibility,
  onToggleSharedApiKeyVisibility,
  onToggleUseSharedApi,
  onSave,
  onSavePersonal,
  onSaveShared,
  onDeletePersonal,
  onDeleteShared,
  onToggleActive,
}: ProviderAccordionItemProps) {
  return (
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
                {provider.models.length > 0 ? `${provider.models.length} مدل` : 'بدون مدل'}
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
            personalApiKey={personalApiKey}
            sharedApiKey={sharedApiKey}
            hasStoredPersonalApiKey={hasStoredPersonalApiKey}
            hasStoredSharedApiKey={hasStoredSharedApiKey}
            showPersonalApiKey={showPersonalApiKey}
            showSharedApiKey={showSharedApiKey}
            isSaving={isSaving}
            isSuperAdmin={isSuperAdmin}
            allowNormalAdmins={allowNormalAdmins}
            hasSharedApi={hasSharedApi}
            canUseSharedApi={canUseSharedApi}
            onToggleApiKeyVisibility={onToggleApiKeyVisibility}
            onApiKeyChange={onApiKeyChange}
            onPersonalApiKeyChange={onPersonalApiKeyChange}
            onSharedApiKeyChange={onSharedApiKeyChange}
            onTogglePersonalApiKeyVisibility={onTogglePersonalApiKeyVisibility}
            onToggleSharedApiKeyVisibility={onToggleSharedApiKeyVisibility}
            onToggleUseSharedApi={onToggleUseSharedApi}
            onSave={onSave}
            onSavePersonal={onSavePersonal}
            onSaveShared={onSaveShared}
            onDeletePersonal={onDeletePersonal}
            onDeleteShared={onDeleteShared}
            isActive={isActive}
            onToggleActive={onToggleActive}
          />
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
}
