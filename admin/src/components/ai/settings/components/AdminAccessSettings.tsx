"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/elements/Card';
import { Switch } from '@/components/elements/Switch';
import { Label } from '@/components/elements/Label';
import { Settings, Info, Shield, Key, Users, Lock, Unlock } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { showSuccessToast, showErrorToast } from '@/core/config/errorHandler';
import { aiApi } from '@/api/ai/route';

interface AdminAccessSettingsProps {
  isSuperAdmin: boolean;
}

export function AdminAccessSettings({
  isSuperAdmin,
}: AdminAccessSettingsProps) {
  if (!isSuperAdmin) return null;

  // دریافت Global Control از backend (از طریق API route)
  // ✅ NO CACHE: Real-time global control - always fresh from backend
  const { data: globalControlData, isLoading } = useQuery({
    queryKey: ['ai-global-control'],
    queryFn: async () => {
      const response = await aiApi.personalSettings.getGlobalControl();
      return response.data;
    },
    staleTime: 0,  // No cache - always fetch fresh
    gcTime: 0,     // No garbage collection cache
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const queryClient = useQueryClient();

  // Mutation برای تغییر Global Control
  const toggleGlobalControlMutation = useMutation({
    mutationFn: async (allowRegularAdmins: boolean) => {
      const response = await aiApi.personalSettings.updateGlobalControl(allowRegularAdmins);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-global-control'] });
      showSuccessToast('تنظیمات با موفقیت به‌روزرسانی شد');
    },
    onError: (error: any) => {
      showErrorToast(error?.message || 'خطا در به‌روزرسانی تنظیمات');
    },
  });

  const allowRegularAdmins = globalControlData?.allow_regular_admins_use_shared_api ?? true;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-primary" />
          <CardTitle>کنترل دسترسی به API مشترک</CardTitle>
        </div>
        <CardDescription>
          مدیریت دسترسی ادمین‌های معمولی به API های مشترک
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* ✅ Global Control Switch - کنترل کلی */}
        <div 
          className="p-5 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3 flex-1">
              {allowRegularAdmins ? (
                <Unlock className="w-6 h-6 text-green-1 flex-shrink-0 mt-0.5" />
              ) : (
                <Lock className="w-6 h-6 text-red-1 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 flex-1">
                <Label className="text-base font-bold text-font-p">
                  اجازه استفاده از API مشترک برای ادمین‌های معمولی
                </Label>
                <p className="text-sm text-font-s">
                  {allowRegularAdmins ? (
                    <span className="text-green-1 font-medium">
                      ✅ فعال: ادمین‌های معمولی می‌توانند از API مشترک استفاده کنند (با permission)
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
              checked={allowRegularAdmins}
              onCheckedChange={(checked) => toggleGlobalControlMutation.mutate(checked)}
              disabled={isLoading || toggleGlobalControlMutation.isPending}
              className="ml-4"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

