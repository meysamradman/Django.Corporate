import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card';
import { Skeleton } from '@/components/elements/Skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/elements/Select';
import { useAIModelsPageData } from '@/components/ai/models/hooks/useAIModelsPageData';
import { useAIModelsActions } from '@/components/ai/models/hooks/useAIModelsActions';

export default function AIModelsPage() {
  const navigate = useNavigate();
  const { isLoading, rows } = useAIModelsPageData();
  const { selectProviderMutation } = useAIModelsActions({ navigate });

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
                  
                  <div className="flex items-center gap-3 min-w-37.5 sm:min-w-45">
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

                  <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 justify-end max-w-2xl w-full">
                    
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
