# 🤖 AI App - Dynamic Database-Driven System

## ✅ Optimized Architecture (2025)

**Scalable for 40+ AI Models & Providers**

### Core Models (Only 3!)

```python
AIProvider      # AI Provider (OpenAI, Gemini, Anthropic, etc.)
AIModel         # AI Models (GPT-4o, Claude, Gemini Pro, etc.)
AdminProviderSettings  # Admin-specific settings
```

### Key Features

✅ **Zero Code Changes** - Add new providers/models from admin panel  
✅ **High Performance** - Redis cache (5min TTL) + DB indexes  
✅ **Security** - Fernet encryption for API keys  
✅ **Scalability** - Supports unlimited providers & models  
✅ **Flexibility** - JSONField for configuration  

---

## 📊 System Capabilities

### Supported AI Types

- 💬 **Chat** - Text generation & conversations
- 🖼️ **Image** - Image generation (DALL-E, Imagen, etc.)
- 🎵 **Audio** - Audio generation & TTS
- 🗣️ **Speech-to-Text** - Whisper, etc.
- 🎥 **Video** - Video generation (future)
- 📝 **Code** - Code generation
- 🧠 **Embeddings** - Vector embeddings

---

## 🔐 Access Control (State Machine)

```python
AVAILABLE_SHARED    # Using shared API
AVAILABLE_PERSONAL  # Using personal API
NO_ACCESS          # No permission
DISABLED           # Model/provider disabled
```

### Logic:
1. **Super Admin** → Always has shared access
2. **Normal Admin** → Checks `allow_shared_for_normal_admins`
3. **Personal API** → Always allowed if configured

---

## 🚀 Performance Optimizations

### Caching Strategy
- **Provider list**: 5 min cache
- **Models by provider**: 5 min cache
- **Bulk queries**: Single DB hit for multiple providers

### Database Indexes
```python
# AIProvider
- (slug, is_active)
- (is_active, sort_order)
- (allow_shared_for_normal_admins)

# AIModel  
- (provider, is_active)
- (is_active, sort_order)
- (provider, model_id) UNIQUE

# AdminProviderSettings
- (admin, provider) UNIQUE
- (admin, is_active)
```

---

## 📦 File Structure

```
src/ai/
├── models/
│   ├── __init__.py
│   └── ai_provider.py          # ✅ Only 1 model file (650 lines)
├── serializers/
│   ├── __init__.py
│   ├── ai_provider_serializer.py
│   ├── content_generation_serializer.py
│   ├── chat_serializer.py
│   └── audio_generation_serializer.py
├── views/
│   ├── __init__.py
│   ├── ai_provider_views.py
│   ├── content_generation_views.py
│   ├── chat_views.py
│   └── audio_generation_views.py
├── services/
│   ├── __init__.py
│   ├── state_machine.py        # Access control logic
│   ├── content_generation_service.py
│   ├── chat_service.py
│   └── audio_generation_service.py
└── migrations/
    ├── 0001_initial.py
    └── 0002_remove_legacy_models.py
```

**Total Model Code**: ~650 lines (vs 870 lines before)  
**Removed**: 3 legacy models (600+ lines)

---

## 🔄 Migration Guide

### Step 1: Backup Database
```bash
pg_dump -U postgres corporate_db > backup_before_ai_migration.sql
```

### Step 2: Run Data Migration
```bash
python scripts/migrate_ai_legacy_to_dynamic.py
```

### Step 3: Apply Database Migration
```bash
python manage.py migrate ai 0002_remove_legacy_models
```

### Step 4: Verify
```bash
python manage.py shell
>>> from src.ai.models import AIProvider, AIModel, AdminProviderSettings
>>> AIProvider.objects.count()
>>> AIModel.objects.count()
```

---

## 💡 Usage Examples

### Add New Provider (Super Admin)
```python
provider = AIProvider.objects.create(
    name='deepseek',
    slug='deepseek',
    display_name='DeepSeek AI',
    website='https://deepseek.com',
    api_base_url='https://api.deepseek.com/v1',
    shared_api_key='sk-xxx',  # Auto-encrypted
    allow_shared_for_normal_admins=True,
    is_active=True
)
```

### Add Models to Provider
```python
AIModel.objects.bulk_create([
    AIModel(
        provider=provider,
        name='deepseek-chat',
        model_id='deepseek-chat',
        display_name='DeepSeek Chat',
        capabilities=['chat', 'code'],
        is_active=True
    ),
    AIModel(
        provider=provider,
        name='deepseek-coder',
        model_id='deepseek-coder',
        display_name='DeepSeek Coder',
        capabilities=['code'],
        is_active=True
    ),
])
```

### Admin Personal Settings
```python
settings = AdminProviderSettings.objects.create(
    admin=admin_user,
    provider=provider,
    personal_api_key='sk-personal-xxx',  # Auto-encrypted
    use_shared_api=False,  # Use personal key
    monthly_limit=10000,
    is_active=True
)
```

---

## 📈 Scalability for 40+ Models

### Current Design Supports:
- ✅ **Unlimited Providers** - Database-driven
- ✅ **Unlimited Models** - No hardcoded limits
- ✅ **Batch Queries** - `get_active_models_bulk()`
- ✅ **Efficient Caching** - 5min TTL, pattern-based invalidation
- ✅ **Clean API** - RESTful, easy to extend

### Example: 40 Models Across 10 Providers
```python
# Single query for all models
models = AIModel.get_active_models_bulk([
    'openai', 'anthropic', 'google', 'deepseek', 
    'groq', 'mistral', 'cohere', 'huggingface'
])

# Returns: Dict[provider_slug, List[AIModel]]
# Cached for 5 minutes
```

---

## 🎯 State Machine Example

```python
from src.ai.services.state_machine import ModelAccessState

# Check access
state = ModelAccessState.calculate(provider, model, admin)

if state == ModelAccessState.AVAILABLE_SHARED:
    api_key = provider.get_shared_api_key()
elif state == ModelAccessState.AVAILABLE_PERSONAL:
    settings = AdminProviderSettings.objects.get(admin=admin, provider=provider)
    api_key = settings.get_personal_api_key()
else:
    raise PermissionDenied("No access to this model")
```

---

## ⚠️ Important Notes

1. **API Keys** - Always encrypted with Fernet
2. **Cache** - Auto-invalidated on model/provider changes
3. **Permissions** - Enforced by State Machine
4. **Scalability** - Designed for 100+ models

---

## 🔧 Admin Panel Integration

### Next.js Frontend Structure
```typescript
// Types
interface AIProvider {
  id: number;
  name: string;
  display_name: string;
  is_active: boolean;
  allow_shared_for_normal_admins: boolean;
}

interface AIModel {
  id: number;
  provider: AIProvider;
  name: string;
  display_name: string;
  capabilities: string[];
  is_active: boolean;
}

// API Endpoints
GET    /api/v1/ai/providers/          # List providers
POST   /api/v1/ai/providers/          # Create provider
GET    /api/v1/ai/providers/{id}/     # Get provider
PUT    /api/v1/ai/providers/{id}/     # Update provider
DELETE /api/v1/ai/providers/{id}/     # Delete provider

GET    /api/v1/ai/models/             # List models
GET    /api/v1/ai/models/{id}/        # Get model
POST   /api/v1/ai/models/             # Create model
```

---

**Last Updated**: 2025-01-28  
**Status**: ✅ Production Ready  
**Performance**: Optimized for 40+ models
