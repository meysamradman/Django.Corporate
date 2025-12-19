import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/elements/Card';
import { Switch } from '@/components/elements/Switch';
import { Label } from '@/components/elements/Label';
import { Settings, Lock, Unlock, Shield } from 'lucide-react';
import type { GlobalControlSetting } from '@/types/ai/ai';
import { frontendToBackendProviderMap } from '../hooks/useAISettings';
import { getProviderMetadata } from '../config/providerConfig';

interface AdminAccessSettingsProps {
  isSuperAdmin: boolean;
  globalControlData?: GlobalControlSetting[];
  isLoadingGlobalControl: boolean;
  onToggleGlobalControl: (providerName: string, allow: boolean) => void;
}

export function AdminAccessSettings({
  isSuperAdmin,
  globalControlData,
  isLoadingGlobalControl,
  onToggleGlobalControl,
}: AdminAccessSettingsProps) {
  if (!isSuperAdmin) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-primary" />
          <CardTitle>کنترل دسترسی به API مشترک - بر اساس Provider</CardTitle>
        </div>
        <CardDescription>
          مدیریت دسترسی ادمین‌های معمولی به API مشترک به صورت جداگانه برای هر Provider
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingGlobalControl ? (
          <div className="text-center py-8 text-font-s">
            در حال بارگذاری...
          </div>
        ) : (
          <div className="space-y-4">
            {globalControlData && globalControlData.length > 0 ? (
              globalControlData.map((control) => {
                const frontendId = Object.keys(frontendToBackendProviderMap).find(
                  (key) => frontendToBackendProviderMap[key] === control.provider_name
                ) || control.provider_name;
                
                const metadata = getProviderMetadata(frontendId);
                const isAllowed = control.allow_normal_admins_use_shared_api;

                return (
                  <div
                    key={control.id}
                    className="p-4 bg-gradient-to-r from-primary/5 to-primary/2 border border-primary/20 rounded-lg hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {isAllowed ? (
                          <Unlock className="w-5 h-5 text-green-1 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Lock className="w-5 h-5 text-red-1 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{metadata?.icon || '🔧'}</span>
                            <Label className="text-base font-bold text-font-p">
                              {metadata?.name || control.provider_name}
                            </Label>
                          </div>
                          <p className="text-sm text-font-s">
                            {isAllowed ? (
                              <span className="text-green-1 font-medium">
                                ✅ فعال: ادمین‌های معمولی می‌توانند از Shared API این Provider استفاده کنند
                              </span>
                            ) : (
                              <span className="text-red-1 font-medium">
                                ❌ غیرفعال: ادمین‌های معمولی فقط می‌توانند از API شخصی استفاده کنند
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={isAllowed}
                        onCheckedChange={(checked) => onToggleGlobalControl(control.provider_name, checked)}
                        className="ml-4"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-font-s">
                <Shield className="w-12 h-12 mx-auto mb-3 text-primary/50" />
                <p>هیچ Provider فعالی یافت نشد</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

