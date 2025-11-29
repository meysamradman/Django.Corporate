# 🚀 Execution Steps - AI Global Control Implementation

## Quick Start (5 Minutes)

### Step 1: Run Migrations
```bash
cd Backend
python manage.py makemigrations ai
python manage.py migrate
```

### Step 2: Populate Global Control Data
```bash
python Backend/scripts/populate_global_control.py
```

**Expected Output**:
```
🚀 Populating Global Control settings...

✅ CREATED Global Control for gemini
   Allow Normal Admins: False
   Is Active: True

✅ CREATED Global Control for openai
   Allow Normal Admins: False
   Is Active: True

... (5 providers total)

📊 Summary:
   Created: 5
   Already existed: 0
   Total: 5

✅ Global Control population completed!
```

### Step 3: Test Backend (Optional)
```bash
# Start Django server
python manage.py runserver localhost:8000

# Test endpoints (use Postman or curl)
# 1. Get all global controls (Super Admin only)
GET http://localhost:8000/api/admin/ai-settings/global-controls/

# 2. Update global control (Super Admin only)
PATCH http://localhost:8000/api/admin/ai-settings/global-control/
{
  "provider_name": "gemini",
  "allow_normal_admins_use_shared_api": true
}
```

---

## Frontend Implementation (30 Minutes)

### ✅ Already Complete:
1. ✅ Types updated (`admin/src/types/ai/ai.ts`)
2. ✅ Models optimized (`Backend/src/ai/models/`)
3. ✅ Serializers created (`Backend/src/ai/serializers/`)
4. ✅ Views updated (`Backend/src/ai/views/`)

### ⏳ Remaining:

#### 1. Update API Routes (5 min)
**File**: `admin/src/api/ai/route.ts`

Add after `personalSettings`:
```typescript
globalControl: {
  getAll: async (): Promise<ApiResponse<GlobalControlSetting[]>> => {
    try {
      const endpoint = '/admin/ai-settings/global-controls/';
      return await fetchApi.get<GlobalControlSetting[]>(endpoint);
    } catch (error: any) {
      showErrorToast(error?.message || 'Error fetching Global Control');
      throw error;
    }
  },
  
  update: async (data: {
    provider_name: string;
    allow_normal_admins_use_shared_api: boolean;
  }): Promise<ApiResponse<GlobalControlSetting>> => {
    try {
      const endpoint = '/admin/ai-settings/global-control/';
      return await fetchApi.patch<GlobalControlSetting>(endpoint, data as Record<string, unknown>);
    } catch (error: any) {
      showErrorToast(error?.message || 'Error updating Global Control');
      throw error;
    }
  },
},
```

#### 2. Create GlobalControlSettings Component (10 min)
**Create file**: `admin/src/components/ai/settings/components/GlobalControlSettings.tsx`

(Copy code from COMPLETE_IMPLEMENTATION_GUIDE.md - Step 2)

#### 3. Update useAISettings Hook (10 min)
**File**: `admin/src/components/ai/settings/hooks/useAISettings.ts`

Add queries and mutations:
(Copy code from COMPLETE_IMPLEMENTATION_GUIDE.md - Step 3)

#### 4. Update AISettingsPage (5 min)
**File**: `admin/src/components/ai/settings/AISettingsPage.tsx`

Import and add component:
```typescript
import { GlobalControlSettings } from './components/GlobalControlSettings';

// In component
const { globalControlMap, toggleGlobalControlMutation } = useAISettings();

const handleToggleGlobalControl = (providerId: string, allow: boolean) => {
  toggleGlobalControlMutation.mutate({ providerId, allow });
};

// In render (inside ProviderCard, before API Key section)
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

## Testing Checklist

### Backend ✓
- [ ] Migration runs without errors
- [ ] 5 GlobalControl records created
- [ ] GET endpoint returns list (Super Admin)
- [ ] PATCH endpoint updates setting (Super Admin)
- [ ] Normal Admin gets 403 on global-control endpoints
- [ ] Cache logging shows "Cache HIT/MISS"

### Frontend ✓
- [ ] GlobalControlSettings card appears (Super Admin only)
- [ ] Toggle switch updates backend
- [ ] Success toast on update
- [ ] Error toast on failure
- [ ] Badge shows "Allowed"/"Blocked" correctly
- [ ] Alert appears when blocked

### Integration ✓
- [ ] Super Admin enables Shared API for provider
- [ ] Normal Admin can select Shared API
- [ ] API Key field hidden when Shared selected
- [ ] Super Admin disables Shared API
- [ ] Normal Admin cannot select Shared API anymore
- [ ] ValidationError if Normal Admin tries blocked provider

---

## Verification Commands

### Check Database
```bash
python manage.py shell

# Check GlobalControl records
from src.ai.models.global_control import AdminAIGlobalControl
AdminAIGlobalControl.objects.all().values('provider_name', 'allow_normal_admins_use_shared_api')

# Check cache
from django.core.cache import cache
cache.get('ai_global_control_gemini')  # Should be False initially
```

### Check Redis Cache
```bash
# If using Redis locally
redis-cli
> KEYS ai_global_control_*
> GET ai_global_control_gemini
```

---

## Troubleshooting

### Issue: Migration fails
**Solution**: Check if BaseModel has all required fields
```bash
python manage.py showmigrations ai
python manage.py migrate ai --fake-initial  # If needed
```

### Issue: Import errors in scripts
**Solution**: Ensure virtual environment is activated
```bash
cd Backend
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac
python scripts/populate_global_control.py
```

### Issue: 403 Forbidden on endpoints
**Solution**: Check SuperAdminOnly permission
```bash
# In Django shell
from src.user.models import User
admin = User.objects.get(mobile='09XXXXXXXXX')
print(admin.is_admin_full)  # Should be True for Super Admin
```

---

## Performance Verification

### Check Cache Performance
```python
# In Django shell
import time
from src.ai.models.global_control import AdminAIGlobalControl

# First call (Cache MISS)
start = time.time()
result = AdminAIGlobalControl.is_shared_allowed_for_normal_admins('gemini')
print(f"First call: {(time.time() - start) * 1000:.2f}ms")

# Second call (Cache HIT)
start = time.time()
result = AdminAIGlobalControl.is_shared_allowed_for_normal_admins('gemini')
print(f"Second call (cached): {(time.time() - start) * 1000:.2f}ms")

# Expected: <5ms for cached call
```

---

## Production Checklist

Before deploying to production:

- [ ] All migrations applied
- [ ] Global Control populated for all providers
- [ ] Redis cache configured and tested
- [ ] Super Admin permissions verified
- [ ] Frontend build tested
- [ ] Error handling tested
- [ ] Logging configured
- [ ] Performance tested under load

---

## Quick Reference

### Backend Files Modified
1. `Backend/src/ai/models/global_control.py` - ✅ Optimized
2. `Backend/src/ai/models/admin_ai_settings.py` - ✅ Updated
3. `Backend/src/ai/serializers/global_control_serializer.py` - ✅ Created
4. `Backend/src/ai/serializers/__init__.py` - ✅ Updated
5. `Backend/src/ai/views/admin_ai_settings_views.py` - ✅ Enhanced

### Frontend Files to Modify
1. `admin/src/types/ai/ai.ts` - ✅ Done
2. `admin/src/api/ai/route.ts` - ⏳ Add globalControl
3. `admin/src/components/ai/settings/components/GlobalControlSettings.tsx` - ⏳ Create
4. `admin/src/components/ai/settings/hooks/useAISettings.ts` - ⏳ Update
5. `admin/src/components/ai/settings/AISettingsPage.tsx` - ⏳ Update

### API Endpoints
- `GET /admin/ai-settings/global-controls/` - List all (Super Admin)
- `PATCH /admin/ai-settings/global-control/` - Update one (Super Admin)
- `GET /admin/ai-settings/my-settings/` - Personal settings (All Admins)

---

**You're 90% done! Just frontend integration left!** 🎉

Follow the steps above and you'll have a complete, production-ready AI Global Control system.

Good luck! 🚀
