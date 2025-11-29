# 🔥 AI & Permission System - Complete Implementation Plan

## 📊 خلاصه کلی

این پلن برای پیاده‌سازی کامل سیستم AI با دسترسی‌های پیشرفته بر اساس `all.md` و بهترین practices 2025

---

## 🎯 بخش 1: قوانین دسترسی AI (از all.md)

### Super Admin (is_admin_full=True):
- ✅ می‌تواند Shared API را فعال/غیرفعال کند
- ✅ می‌تواند تعیین کند Normal Admin ها اجازه استفاده از Shared API دارند یا نه
- ✅ می‌تواند از Shared یا Personal API استفاده کند (آزاد)
- ✅ API Key Shared را مدیریت می‌کند

### Normal Admin:
- اگر Super اجازه داده → می‌تواند Shared API استفاده کند
- اگر Super اجازه نداده → فقط Personal API
- **مهم**: فیلد API Key Shared را نمی‌بیند (فقط سوپر می‌بیند)
- اگر روی Personal است → فیلد API Key نمایش داده می‌شود
- اگر روی Shared است → فیلد API Key نباید نمایش داده شود

---

## 🏗️ بخش 2: معماری Database

### 1. AdminAIGlobalControl (موجود - نیاز به بهینه‌سازی)
```python
class AdminAIGlobalControl(BaseModel):
    provider_name = CharField(unique=True)  # per-provider control
    allow_normal_admins_use_shared_api = BooleanField(default=False)
```

**✅ این مدل OK است** - فقط نیاز به Redis caching دارد

### 2. AIImageGeneration (Shared Providers)
```python
class AIImageGeneration(BaseModel):
    provider_name = CharField(unique=True)
    api_key = TextField(encrypted)
    is_active = BooleanField(default=False)
    config = JSONField()
```

**✅ این مدل OK است** - فقط نیاز به index optimization

### 3. AdminAISettings (Personal Settings)
```python
class AdminAISettings(BaseModel):
    admin = ForeignKey(User)
    provider_name = CharField()
    api_key = TextField(encrypted, blank=True)
    use_shared_api = BooleanField(default=True)
    is_active = BooleanField(default=True)
    monthly_limit = IntegerField(default=1000)
    monthly_usage = IntegerField(default=0)
    
    class Meta:
        unique_together = ['admin', 'provider_name']
```

**✅ این مدل OK است** - فقط نیاز به validation بهتر

---

## 🔧 بخش 3: Backend Changes Required

### 1. Optimize AdminAIGlobalControl با Redis Cache

**فایل**: `src/ai/models/global_control.py`

```python
from django.core.cache import cache

class AdminAIGlobalControl(BaseModel):
    # ... existing fields ...
    
    @classmethod
    def is_shared_allowed_for_normal_admins(cls, provider_name: str) -> bool:
        """Check if normal admins can use shared API - با Redis cache"""
        cache_key = f"ai_global_control_{provider_name}"
        allowed = cache.get(cache_key)
        
        if allowed is None:
            try:
                control = cls.objects.get(provider_name=provider_name)
                allowed = control.allow_normal_admins_use_shared_api
                cache.set(cache_key, allowed, 300)  # 5 min cache
            except cls.DoesNotExist:
                allowed = False  # Default: نمی‌توانند استفاده کنند
                cache.set(cache_key, allowed, 60)  # 1 min cache for DoesNotExist
        
        return allowed
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Clear cache on save
        cache_key = f"ai_global_control_{self.provider_name}"
        cache.delete(cache_key)
```

### 2. Update AdminAISettings.get_api_key_for_admin()

**فایل**: `src/ai/models/admin_ai_settings.py`

این متد باید Global Control را چک کند:

```python
@classmethod
def get_api_key_for_admin(cls, admin, provider_name):
    """
    دریافت API Key با احتساب Global Control
    """
    from src.ai.models.global_control import AdminAIGlobalControl
    from src.user.permissions.validator import PermissionValidator
    
    is_super_admin = admin.is_superuser or admin.is_admin_full
    
    try:
        settings = cls.objects.get(admin=admin, provider_name=provider_name, is_active=True)
        
        # اگر از API مشترک استفاده می‌کند
        if settings.use_shared_api:
            # ✅ FIX: Check Global Control first
            if not is_super_admin:
                # Normal admin - باید Global Control چک بشه
                is_allowed = AdminAIGlobalControl.is_shared_allowed_for_normal_admins(provider_name)
                
                if not is_allowed:
                    raise ValidationError(
                        "استفاده از API مشترک برای این Provider توسط مدیر سیستم غیرفعال شده است. "
                        "لطفاً از API شخصی استفاده کنید."
                    )
            
            # Shared API allowed - return shared key
            from src.ai.models.image_generation import AIImageGeneration
            shared_provider = AIImageGeneration.get_active_provider(provider_name)
            if not shared_provider:
                raise ValidationError(f"Provider '{provider_name}' فعال نیست.")
            
            return shared_provider.get_api_key()
        
        # Personal API
        personal_api_key = settings.get_api_key()
        if not personal_api_key:
            raise ValidationError("API Key شخصی وارد نشده است.")
        
        if settings.has_reached_limit():
            raise ValidationError("به محدودیت ماهانه رسیده‌اید.")
        
        return personal_api_key
    
    except cls.DoesNotExist:
        # No personal settings - try shared API
        if not is_super_admin:
            is_allowed = AdminAIGlobalControl.is_shared_allowed_for_normal_admins(provider_name)
            if not is_allowed:
                raise ValidationError(
                    "شما تنظیمات AI شخصی ندارید و به API مشترک هم دسترسی ندارید."
                )
        
        # Use shared API
        from src.ai.models.image_generation import AIImageGeneration
        shared_provider = AIImageGeneration.get_active_provider(provider_name)
        if not shared_provider:
            raise ValidationError(f"Provider '{provider_name}' فعال نیست.")
        
        return shared_provider.get_api_key()
```

### 3. Add Permissions to Views

**فایل**: `src/ai/views/admin_ai_settings_views.py`

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from src.user.authorization.admin_permission import AdminRolePermission
from src.user.permissions import PermissionValidator

class AdminAISettingsViewSet(viewsets.ModelViewSet):
    permission_classes = [AdminRolePermission]
    
    def get_queryset(self):
        # فقط تنظیمات خودش را ببیند
        return AdminAISettings.objects.filter(admin=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_settings(self, request):
        """Get current admin's personal settings"""
        settings = self.get_queryset()
        serializer = self.get_serializer(settings, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get', 'patch'])
    def global_control(self, request):
        """
        Get/Update Global Control settings
        ✅ فقط Super Admin می‌تواند تغییر دهد
        """
        # Check permission
        if not PermissionValidator.has_permission(request.user, 'ai.settings.shared.manage'):
            return Response(
                {'error': 'شما به مدیریت تنظیمات مشترک AI دسترسی ندارید'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if request.method == 'GET':
            # Return all global controls
            from src.ai.models.global_control import AdminAIGlobalControl
            controls = AdminAIGlobalControl.objects.all()
            serializer = GlobalControlSerializer(controls, many=True)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            # Update global control
            provider_name = request.data.get('provider_name')
            allow = request.data.get('allow_normal_admins_use_shared_api')
            
            from src.ai.models.global_control import AdminAIGlobalControl
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

---

## 🎨 بخش 4: Frontend Changes Required

### 1. Update Types

**فایل**: `admin/src/types/ai/ai.ts`

```typescript
export interface GlobalControlSetting {
  id: number;
  provider_name: string;
  allow_normal_admins_use_shared_api: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminAISetting {
  id: number;
  provider_name: string;
  api_key?: string;
  use_shared_api: boolean;
  is_active: boolean;
  monthly_limit: number;
  monthly_usage: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AIProvider {
  id: number;
  provider_name: string;
  api_key?: string;
  is_active: boolean;
  config: Record<string, any>;
  usage_count: number;
  last_used_at?: string;
}
```

### 2. Update API Route

**فایل**: `admin/src/api/ai/route.ts`

```typescript
export const aiApi = {
  
  globalControl: {
    /**
     * دریافت تنظیمات Global Control همه Provider ها
     * فقط Super Admin
     */
    getAll: async (): Promise<ApiResponse<GlobalControlSetting[]>> => {
      try {
        const endpoint = '/admin/ai-settings/global-control/';
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
};
```

### 3. Add GlobalControlSettings Component

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

### 4. Update AISettingsPage

**فایل**: `admin/src/components/ai/settings/AISettingsPage.tsx`

اضافه کردن Global Control به هر Provider Card:

```typescript
// در داخل ProviderCard، قبل از API Key Input:

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

## 📝 بخش 5: Migration Plan

### Step 1: Create Migration for Index Optimization
```bash
python manage.py makemigrations ai --name optimize_ai_models_indexes
```

### Step 2: Populate GlobalControl for existing providers
```python
# scripts/populate_global_control.py
from src.ai.models.image_generation import AIImageGeneration
from src.ai.models.global_control import AdminAIGlobalControl

providers = AIImageGeneration.objects.all()
for provider in providers:
    AdminAIGlobalControl.objects.get_or_create(
        provider_name=provider.provider_name,
        defaults={'allow_normal_admins_use_shared_api': False}  # Default: غیرمجاز
    )
```

---

## ⚡ بخش 6: Performance Optimizations

### 1. Redis Caching Strategy
```python
# Cache Keys:
ai_global_control_{provider_name}  # 5 min
ai_provider_{provider_name}         # 5 min
admin_ai_settings_{admin_id}_{provider_name}  # 5 min
```

### 2. Database Indexes
```python
# AdminAIGlobalControl
models.Index(fields=['provider_name'])

# AIImageGeneration
models.Index(fields=['provider_name', 'is_active'])

# AdminAISettings
models.Index(fields=['admin', 'provider_name', 'is_active'])
models.Index(fields=['admin', 'use_shared_api'])
```

---

## ✅ بخش 7: Testing Checklist

### Backend Tests:
- [ ] Super admin can toggle global control
- [ ] Normal admin cannot toggle global control
- [ ] Normal admin blocked from shared API when not allowed
- [ ] Personal API works independently
- [ ] Redis cache invalidation works
- [ ] Permission checks work correctly

### Frontend Tests:
- [ ] Global control UI only visible to super admin
- [ ] API key field hidden when using shared API
- [ ] API key field shown when using personal API
- [ ] Normal admin sees correct options based on global control
- [ ] Toggle animations work smoothly

---

## 🎯 Implementation Order

1. ✅ Backend: Optimize GlobalControl model + Redis cache
2. ✅ Backend: Update AdminAISettings.get_api_key_for_admin()
3. ✅ Backend: Add permissions to views
4. ✅ Frontend: Update types
5. ✅ Frontend: Update API routes
6. ✅ Frontend: Create GlobalControlSettings component
7. ✅ Frontend: Update AISettingsPage
8. ✅ Testing: End-to-end tests
9. ✅ Documentation: Update all.md with final implementation

---

**این پلن کامل و آماده پیاده‌سازی است! 🚀**
