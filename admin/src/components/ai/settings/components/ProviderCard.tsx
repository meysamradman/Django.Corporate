"use client";

import { useMemo } from 'react';
import { CardContent } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';
import { Label } from '@/components/elements/Label';
import { Badge } from '@/components/elements/Badge';
import { Switch } from '@/components/elements/Switch';
import { Eye, EyeOff, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { Provider, Model } from '../hooks/useAISettings';

interface ProviderCardProps {
  provider: Provider;
  isExpanded: boolean;
  apiKey: string;
  showApiKey: boolean;
  useSharedApi: boolean;
  hasStoredApiKey?: boolean;
  isSuperAdmin?: boolean;
  allowNormalAdmins?: boolean;
  hasSharedApi?: boolean;
  canUseSharedApi?: boolean;
  isActive?: boolean;
  onToggleApiKeyVisibility: () => void;
  onApiKeyChange: (value: string) => void;
  onToggleUseSharedApi: (checked: boolean) => void;
  onToggleGlobalControl?: (allow: boolean) => void;
  onToggleActive?: (checked: boolean) => void;
  onSave: () => void;
  isSaving?: boolean;
}

function maskApiKey(apiKey: string, showFull: boolean = false): string {
  if (!apiKey || apiKey.trim() === '') return '';

  if (showFull) return apiKey;

  if (apiKey.length <= 8) return '•'.repeat(apiKey.length);

  const prefix = apiKey.substring(0, 4);
  const suffix = apiKey.substring(apiKey.length - 4);
  const masked = '•'.repeat(Math.min(8, apiKey.length - 8));

  return `${prefix}${masked}${suffix}`;
}

export function ProviderCard({
  provider,
  isExpanded,
  apiKey,
  showApiKey,
  useSharedApi,
  hasStoredApiKey = false,
  isSuperAdmin = false,
  allowNormalAdmins = false,
  hasSharedApi = false,
  canUseSharedApi: canUseSharedApiProp,
  isActive = false,
  onToggleApiKeyVisibility,
  onApiKeyChange,
  onToggleUseSharedApi,
  onToggleGlobalControl,
  onToggleActive,
  onSave,
  isSaving = false,
}: ProviderCardProps) {
  const canUseSharedApi = canUseSharedApiProp !== undefined
    ? canUseSharedApiProp
    : (isSuperAdmin || (allowNormalAdmins && hasSharedApi));

  return (
    <CardContent className="pt-6 pb-6 space-y-6">
      {onToggleActive && (
        <div className="p-4 bg-gradient-to-r from-bg/80 to-bg/40 rounded-lg border-2 border-br hover:border-primary/20 transition-all">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <Label className="text-base font-semibold block text-font-p">وضعیت Provider</Label>
              <p className="text-xs text-font-s mt-1">
                {isActive
                  ? '✅ Provider فعال و آماده استفاده است'
                  : '❌ Provider غیرفعال است - برای استفاده فعال کنید'}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Switch
                checked={isActive}
                onCheckedChange={onToggleActive}
                disabled={isSaving}
              />
              <Badge variant={isActive ? "green" : "gray"} className="min-w-[70px] text-center">
                {isActive ? 'فعال' : 'غیرفعال'}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {isSuperAdmin && onToggleGlobalControl && (
        <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 rounded-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <Label className="text-base font-semibold block text-primary">کنترل دسترسی ادمین‌های معمولی</Label>
              <p className="text-xs text-font-s mt-1">
                {allowNormalAdmins
                  ? '✅ ادمین‌های معمولی می‌توانند از API مشترک این Provider استفاده کنند'
                  : '❌ ادمین‌های معمولی فقط می‌توانند از API شخصی خود استفاده کنند'}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Switch
                checked={allowNormalAdmins}
                onCheckedChange={onToggleGlobalControl}
                disabled={isSaving}
              />
              <Badge variant={allowNormalAdmins ? "green" : "red"} className="min-w-[70px] text-center">
                {allowNormalAdmins ? 'مجاز' : 'غیرمجاز'}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {canUseSharedApi && (
        <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-bg/80 to-bg/40 rounded-lg border border-br transition-colors">
          <div className="space-y-1 flex-1 pr-4">
            <Label className="text-base font-medium block">نوع API Key</Label>
            <p className="text-xs text-font-s mt-1">
              {useSharedApi
                ? 'استفاده از API مشترک (مدیریت شده توسط سوپر ادمین)'
                : 'استفاده از API شخصی (فقط برای شما)'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Switch
              checked={useSharedApi}
              onCheckedChange={onToggleUseSharedApi}
              disabled={isSaving}
              className={useSharedApi
                ? "data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-400"
                : "data-[state=checked]:bg-purple-500 data-[state=unchecked]:bg-gray-400"
              }
            />
            <Badge
              variant={useSharedApi ? "default" : "outline"}
              className={`min-w-[60px] text-center ${useSharedApi ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'}`}
            >
              {useSharedApi ? 'مشترک' : 'شخصی'}
            </Badge>
          </div>
        </div>
      )}

      {!canUseSharedApi && (
        <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-bg/80 to-bg/40 rounded-lg border border-br transition-colors">
          <div className="space-y-1 flex-1 pr-4">
            <Label className="text-base font-medium block">نوع API Key</Label>
            <p className="text-xs text-font-s mt-1">
              استفاده از API شخصی (فقط برای شما)
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Badge
              variant="outline"
              className="min-w-[60px] text-center bg-purple-500/10 text-purple-500 border-purple-500/20"
            >
              شخصی
            </Badge>
          </div>
        </div>
      )}

      {(isSuperAdmin || (!isSuperAdmin && !useSharedApi)) && (
        <div className="space-y-3">
          {hasStoredApiKey && (
            <div className="flex justify-end">
              <Badge variant="green" className="text-xs flex-shrink-0">
                ذخیره شده
              </Badge>
            </div>
          )}
          <div className="relative">
            <Input
              id={`api-key-${provider.id}`}
              name={`api-key-${provider.id}`}
              type={showApiKey ? "text" : "password"}
              value={apiKey || ''}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder={hasStoredApiKey ? 'API Key ذخیره شده (برای تغییر تایپ کنید)' : 'وارد کردن API Key'}
              className="pr-10 pl-10 font-mono text-sm"
              disabled={isSaving}
              autoComplete="new-password"
            />

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 border-0 shadow-none bg-transparent hover:bg-transparent text-font-s hover:text-font-p z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleApiKeyVisibility();
              }}
              disabled={isSaving}
              title={showApiKey ? 'مخفی کردن' : 'نمایش'}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>

            {apiKey && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 border-0 shadow-none bg-transparent hover:bg-transparent text-font-s hover:text-red-500 z-10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onApiKeyChange('');
                }}
                disabled={isSaving}
                title="پاک کردن"
              >
                <span className="text-lg font-bold leading-none">&times;</span>
              </Button>
            )}
          </div>
          <div className="flex items-start gap-2 mt-2">
            {hasStoredApiKey && !showApiKey && !apiKey && (
              null
            )}

            {hasStoredApiKey && (
              <div className="flex items-start gap-2 flex-1 p-3 bg-green/10 border border-green/20 rounded-md">
                <CheckCircle2 className="h-4 w-4 text-green-1 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-font-s leading-relaxed">
                  <span className="font-medium text-green-1">API key ذخیره شده است.</span>
                </p>
              </div>
            )}

            {!hasStoredApiKey && !useSharedApi && (
              <p className="text-xs text-font-s">
                این API key فقط برای شما ذخیره می‌شود و رمزنگاری می‌گردد
              </p>
            )}
          </div>
        </div>
      )}

      {useSharedApi && !isSuperAdmin && (
        <div className="p-3 bg-blue/10 border border-blue/20 rounded-md mb-4">
          <p className="text-xs text-font-s">
            ✅ از API مشترک استفاده می‌شود. نیازی به وارد کردن API key نیست.
          </p>
        </div>
      )}

      <div className="pt-6 border-t border-br">
        <Button
          className="w-full gap-2"
          onClick={onSave}
          disabled={isSaving || (!hasStoredApiKey && !apiKey?.trim())}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              ذخیره تنظیمات
            </>
          )}
        </Button>
      </div>
    </CardContent>
  );
}

