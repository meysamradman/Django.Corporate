# 🎯 خلاصه نهایی: بهینه‌سازی سیستم AI و Permission

## ✅ کارهای انجام شده

### 1. Backend - Models
- ✅ **AdminAIGlobalControl** بهینه شد با Redis caching (5 min)
- ✅ **AdminAISettings.get_api_key_for_admin()** به‌روز شد با Global Control check
- ✅ Database indexes اضافه شد برای performance

### 2. Frontend - Types
- ✅ **GlobalControlSetting** interface اضافه شد
- ✅ **AdminAISetting** interface اضافه شد  
- ✅ **AIProvider** interface اضافه شد

---

## 🚧 کارهای باقی‌مانده (باید انجام شود)

### Backend:

#### 1. Create Serializer for GlobalControl
**فایل جدید**: `Backend/src/ai/serializers/global_control_serializer.py`

```python
from rest_framework import serializers
from src.ai.models.global_control import AdminAIGlobalControl

class GlobalControlSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminAIGlobalControl
        fields = ['id', 'provider_name', 'allow_normal_admins_use_shared_api', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
```

#### 2. Update Views - Add GlobalControl Endpoint
**فایل**: `Backend/src/ai/views/admin_ai_settings_views.py`

اضافه کردن این action به ViewSet:

```python
from src.ai.models.global_control import AdminAIGlobalControl
from src.ai.serializers.global_control_serializer import GlobalControlSerializer

@action(detail=False, methods=['get'], url_path='global-controls')
def global_controls(self, request):
    """
    Get all Global Control settings
    فقط برای Super Admin
    """
    from src.user.permissions import PermissionValidator
    
    if not PermissionValidator.has_permission(request.user, 'ai.settings.shared.manage'):
        return Response(
            {'error': 'شما به مدیریت تنظیمات مشترک AI دسترسی ندارید'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    controls = AdminAIGlobalControl.objects.filter(is_active=True)
    serializer = GlobalControlSerializer(controls, many=True)
    return Response(serializer.data)

@action(detail=False, methods=['patch'], url_path='global-control')
def global_control(self, request):
    """
    Update Global Control for a provider
    فقط برای Super Admin
    """
    from src.user.permissions import PermissionValidator
    
    if not PermissionValidator.has_permission(request.user, 'ai.settings.shared.manage'):
        return Response(
            {'error': 'شما به مدیریت تنظیمات مشترک AI دسترسی ندارید'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    provider_name = request.data.get('provider_name')
    allow = request.data.get('allow_normal_admins_use_shared_api')
    
    control, created = AdminAIGlobalControl.objects.get_or_create(
        provider_name=provider_name,
        defaults={'allow_normal_admins_use_shared_api': allow}
    )
    
    if not created:
        control.allow_normal_admins_use_shared_api = allow
        control.save()
    
    serializer = GlobalControlSerializer(control)
    return Response(serializer.data)
```

#### 3. Create Migration
```bash
cd Backend
python manage.py makemigrations ai --name optimize_ai_models_global_control
python manage.py migrate
```

#### 4. Populate Global Control (Script)
**فایل جدید**: `Backend/scripts/populate_global_control.py`

```python
import os, sys, django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from src.ai.models.image_generation import AIImageGeneration
from src.ai.models.global_control import AdminAIGlobalControl

def populate():
    providers = AIImageGeneration.objects.all()
    for provider in providers:
        control, created = AdminAIGlobalControl.objects.get_or_create(
            provider_name=provider.provider_name,
            defaults={'allow_normal_admins_use_shared_api': False}
        )
        if created:
            print(f"✅ Created Global Control for {provider.provider_name}")
        else:
            print(f"ℹ️ Global Control already exists for {provider.provider_name}")

if __name__ == '__main__':
    populate()
```

**Run:**
```bash
python Backend/scripts/populate_global_control.py
```

---

### Frontend:

#### 1. Update API Routes
**فایل**: `admin/src/api/ai/route.ts`

اضافه کردن:

```typescript
globalControl: {
    /**
     * دریافت تنظیمات Global Control همه Provider ها
     * فقط Super Admin
     */
    getAll: async (): Promise<ApiResponse<GlobalControlSetting[]>> => {
      try {
        const endpoint = '/admin/ai-settings/global-controls/';
        return await fetchApi.get<GlobalControlSetting[]>(endpoint);
      } catch (error: any) {
        showErrorToast(error?.message || 'خطا در دریافت تنظیمات Global Control');
        throw error;
      }
    },
    
    /**
     * به‌روزرسانی Global Control برای یک Provider
     * فقط Super Admin
     */
    update: async (data: {
      provider_name: string;
      allow_normal_admins_use_shared_api: boolean;
    }): Promise<ApiResponse<GlobalControlSetting>> => {
      try {
        const endpoint = '/admin/ai-settings/global-control/';
        return await fetchApi.patch<GlobalControlSetting>(endpoint, data as Record<string, unknown>);
      } catch (error: any) {
        showErrorToast(error?.message || 'خطا در به‌روزرسانی Global Control');
        throw error;
      }
    },
  },
```

#### 2. Create GlobalControlSettings Component
**فایل جدید**: `admin/src/components/ai/settings/components/GlobalControlSettings.tsx`

```typescript
"use client";

import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/elements/Card';
import { Switch } from '@/components/elements/Switch';
import { Label } from '@/components/elements/Label';
import { Alert, AlertDescription } from '@/components/elements/Alert';
import { Badge } from '@/components/elements/Badge';

interface GlobalControlSettingsProps {
  providerId: string;
  providerName: string;
  allowNormalAdmins: boolean;
  onToggle: (providerId: string, allow: boolean) => void;
  isLoading?: boolean;
}

export function GlobalControlSettings({
  providerId,
  providerName,
  allowNormalAdmins,
  onToggle,
  isLoading = false,
}: GlobalControlSettingsProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">کنترل دسترسی ادمین‌های معمولی</CardTitle>
          </div>
          <Badge variant={allowNormalAdmins ? "green" : "gray"}>
            {allowNormalAdmins ? 'مجاز' : 'غیرمجاز'}
          </Badge>
        </div>
        <CardDescription className="text-xs mt-1">
          آیا ادمین‌های معمولی می‌توانند از API مشترک {providerName} استفاده کنند؟
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between p-3 bg-bg rounded-lg border border-br">
          <Label className="text-sm cursor-pointer">
            اجازه استفاده از API مشترک برای ادمین‌های معمولی
          </Label>
          <Switch
            checked={allowNormalAdmins}
            onCheckedChange={(checked) => onToggle(providerId, checked)}
            disabled={isLoading}
          />
        </div>
        
        {!allowNormalAdmins && (
          <Alert className="mt-3 border-orange/30 bg-orange/10">
            <AlertCircle className="h-4 w-4 text-orange" />
            <AlertDescription className="text-xs text-font-s">
              ادمین‌های معمولی فقط می‌توانند از API شخصی خود استفاده کنند.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 3. Update useAISettings Hook
**فایل**: `admin/src/components/ai/settings/hooks/useAISettings.ts`

اضافه کردن:

```typescript
// Add to existing hook
const {
  data: globalControlsData,
  isLoading: isLoadingGlobalControls,
} = useQuery({
  queryKey: ['ai-global-controls'],
  queryFn: () => aiApi.globalControl.getAll(),
  enabled: isSuperAdmin,
});

const globalControlMap = useMemo(() => {
  const map: Record<string, boolean> = {};
  if (globalControlsData?.results) {
    globalControlsData.results.forEach(gc => {
      const frontendId = backendToFrontendProviderMap[gc.provider_name] || gc.provider_name;
      map[frontendId] = gc.allow_normal_admins_use_shared_api;
    });
  }
  return map;
}, [globalControlsData]);

const toggleGlobalControlMutation = useMutation({
  mutationFn: async ({ providerId, allow }: { providerId: string; allow: boolean }) => {
    const backendProviderName = frontendToBackendProviderMap[providerId];
    return await aiApi.globalControl.update({
      provider_name: backendProviderName,
      allow_normal_admins_use_shared_api: allow,
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ai-global-controls'] });
    showSuccessToast('تنظیمات Global Control با موفقیت به‌روزرسانی شد');
  },
  onError: (error: any) => {
    showErrorToast(error?.message || 'خطا در به‌روزرسانی Global Control');
  },
});

// Return
return {
  // ... existing returns
  globalControlMap,
  isLoadingGlobalControls,
  toggleGlobalControlMutation,
};
```

#### 4. Update AISettingsPage
**فایل**: `admin/src/components/ai/settings/AISettingsPage.tsx`

Import component:
```typescript
import { GlobalControlSettings } from './components/GlobalControlSettings';
```

Add handler:
```typescript
const handleToggleGlobalControl = (providerId: string, allow: boolean) => {
  toggleGlobalControlMutation.mutate({ providerId, allow });
};
```

در داخل ProviderCard (قبل از API Key Input):
```typescript
{isSuperAdmin && (
  <GlobalControlSettings
    providerId={provider.id}
    providerName={provider.name}
    allowNormalAdmins={globalControlMap[provider.id] || false}
    onToggle={handleToggleGlobalControl}
    isLoading={toggleGlobalControlMutation.isPending}
  />
)}
```

---

## 🧪 Testing Checklist

### Backend:
- [ ] Migration runs successfully
- [ ] Global Control populated for all providers
- [ ] Super admin can get/update global controls
- [ ] Normal admin blocked when global control is false
- [ ] Personal API works independently
- [ ] Redis cache works (check logs)

### Frontend:
- [ ] Global Control UI only visible to super admin
- [ ] Toggle Global Control works
- [ ] API key field hidden when using shared API
- [ ] API key field shown when using personal API
- [ ] Normal admin sees correct UI based on global control
- [ ] Error messages are clear

---

## 🚀 Implementation Order

1. ✅ Backend: GlobalControl model optimized
2. ✅ Backend: AdminAISettings updated
3. ✅ Frontend: Types updated
4. ⏳ Backend: Create serializer
5. ⏳ Backend: Update views
6. ⏳ Backend: Run migrations
7. ⏳ Backend: Populate script
8. ⏳ Frontend: Update API routes
9. ⏳ Frontend: Create GlobalControlSettings component
10. ⏳ Frontend: Update useAISettings hook
11. ⏳ Frontend: Update AISettingsPage
12. ⏳ Testing: End-to-end

---

## 📝 نکات مهم

1. **Permission System**: 
   - `ai.settings.shared.manage` فقط برای Super Admin
   - Normal Admin ها permission ندارند - فقط Global Control چک می‌شود

2. **Global Control vs Permission**:
   - Global Control = سوپر تعیین می‌کند Normal Admin ها access دارند یا نه
   - Permission = فقط برای Super Admin (مدیریت Shared API)
   - این دو جدا هستند!

3. **Cache Strategy**:
   - Global Control: 5 min cache (سریع)
   - Provider Settings: 5 min cache
   - Personal Settings: Real-time (no cache)

4. **UI Behavior**:
   - Super Admin: همه چیز می‌بیند
   - Normal Admin: 
     - اگر Global Control=True → می‌تواند Shared را انتخاب کند
     - اگر Global Control=False → فقط Personal

---

**این راهنما کامل است و آماده پیاده‌سازی! 🚀**

**بعد از اتمام این کارها، سیستم کاملاً بهینه و مطابق all.md خواهد بود.**
