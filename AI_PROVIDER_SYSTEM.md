# 🚀 Dynamic AI Provider System - راهنمای کامل

## 📊 **مشکل قدیمی**

```python
# ❌ BAD: Hardcoded providers
PROVIDER_CHOICES = [
    ('gemini', 'Google Gemini'),
    ('openai', 'OpenAI'),
    # هر بار باید کد تغییر کنیم + Migration + Deploy
]
```

**مشکلات:**
- ❌ برای اضافه کردن Provider جدید باید کد تغییر کنه
- ❌ Migration جدید لازمه
- ❌ Deploy مجدد
- ❌ غیرقابل توسعه برای 30+ مدل

---

## ✅ **راه‌حل: Database-Driven System**

### معماری جدید (با Mixin Pattern)

```
🔐 EncryptedAPIKeyMixin (رمزنگاری/رمزگشایی)
    │
    ├── AIProvider (OpenAI, Anthropic, Google, ...)
    └── AdminProviderSettings (تنظیمات شخصی)

🔄 CacheMixin (Redis Cache)
    │
    ├── AIProvider
    └── AIModel (GPT-4o, Claude 3.5, Gemini 2.5, ...)

🏛️ BaseModel (از src.core.models.base)
    │
    └── همه مدل‌ها (id, public_id, is_active, created_at, updated_at)
```

---

## 🛠️ **مدل‌ها (بهینه و DRY)**

### 1️⃣ **Mixins (بدون تکرار کد)**

#### 🔐 `EncryptedAPIKeyMixin`
```python
class EncryptedAPIKeyMixin:
    """Mixin برای رمزنگاری API Keys"""
    
    @classmethod
    def encrypt_key(cls, api_key: str) -> str:
        """Fernet encryption"""
        # رمزنگاری با Fernet (AES-128)
        # بررسی 'gAAAAAB' برای جلوگیری از تکرار
    
    @classmethod
    def decrypt_key(cls, encrypted_key: str) -> str:
        """Fernet decryption"""
```

**استفاده:**
- `AIProvider` → `shared_api_key`
- `AdminProviderSettings` → `personal_api_key`

#### 🔄 `CacheMixin`
```python
class CacheMixin:
    """Mixin برای Redis Caching"""
    CACHE_TIMEOUT = 300  # 5 دقیقه
    
    def clear_cache(self):
        """Clear cache برای یک instance"""
    
    @classmethod
    def clear_all_cache(cls, pattern=''):
        """Clear cache برای یک model"""
```

**استفاده:**
- `AIProvider.get_active_providers()` → cache 5min
- `AIModel.get_models_by_provider()` → cache 5min

---

### 2️⃣ **`AIProvider` - Providers پویا**

```python
class AIProvider(BaseModel, EncryptedAPIKeyMixin, CacheMixin):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    display_name = models.CharField(max_length=150)
    website = models.URLField(blank=True)
    api_base_url = models.URLField(blank=True)
    
    # Shared API Key (رمزنگاری شده)
    shared_api_key = models.TextField(blank=True)
    
    # Permissions
    allow_personal_keys = models.BooleanField(default=True)
    allow_shared_for_normal_admins = models.BooleanField(default=False)
    
    # Configuration (JSONField)
    config = models.JSONField(default=dict, blank=True)
    
    # Statistics
    total_requests = models.BigIntegerField(default=0)
    last_used_at = models.DateTimeField(null=True, blank=True)
    sort_order = models.IntegerField(default=0, db_index=True)
```

**ویژگی‌ها:**
- ✅ Auto-generate `slug` از `name`
- ✅ Auto-encrypt `shared_api_key` هنگام save
- ✅ `allow_shared_for_normal_admins`: Global Control
- ✅ Redis Cache (5min)
- ✅ DB Indexes برای performance

**Methods:**
```python
# دریافت API Key رمزگشایی شده
provider.get_shared_api_key()

# افزایش شمارنده
provider.increment_usage()

# دریافت همه Provider های فعال (با cache)
AIProvider.get_active_providers()

# دریافت یک Provider (با cache)
AIProvider.get_provider_by_slug('openai')
```

---

### 3️⃣ **`AIModel` - Models پویا**

```python
class AIModel(BaseModel, CacheMixin):
    provider = models.ForeignKey(AIProvider, on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    model_id = models.CharField(max_length=200)  # API ID
    display_name = models.CharField(max_length=200)
    
    # Capabilities (JSONField)
    capabilities = models.JSONField(default=list)
    # مثال: ['chat', 'vision', 'code']
    
    # Pricing (اختیاری)
    pricing_input = models.DecimalField(max_digits=10, decimal_places=6)
    pricing_output = models.DecimalField(max_digits=10, decimal_places=6)
    
    # Limits
    max_tokens = models.IntegerField(null=True)
    context_window = models.IntegerField(null=True)
    
    # Configuration (JSONField)
    config = models.JSONField(default=dict, blank=True)
    
    # Statistics
    total_requests = models.BigIntegerField(default=0)
    sort_order = models.IntegerField(default=0)
```

**Capabilities:**
```python
CAPABILITY_CHOICES = [
    ('chat', 'Chat / Text Generation'),
    ('image', 'Image Generation'),
    ('audio', 'Audio Generation'),
    ('speech_to_text', 'Speech to Text'),
    ('text_to_speech', 'Text to Speech'),
    ('code', 'Code Generation'),
    ('embedding', 'Embeddings'),
    ('vision', 'Vision / Image Understanding'),
]
```

**Methods:**
```python
# چک کردن قابلیت
model.has_capability('chat')  # True/False

# دریافت همه Model های یک Provider (با cache)
AIModel.get_models_by_provider('openai')

# فیلتر بر اساس قابلیت
AIModel.get_models_by_provider('openai', capability='chat')

# دریافت همه Model های با یک قابلیت (از همه Provider ها)
AIModel.get_models_by_capability('chat')
```

---

### 4️⃣ **`AdminProviderSettings` - تنظیمات شخصی**

```python
class AdminProviderSettings(BaseModel, EncryptedAPIKeyMixin):
    admin = models.ForeignKey(User, on_delete=models.CASCADE)
    provider = models.ForeignKey(AIProvider, on_delete=models.CASCADE)
    
    # Personal API Key (رمزنگاری شده)
    personal_api_key = models.TextField(blank=True)
    
    use_shared_api = models.BooleanField(default=True)
    
    # Usage Limits
    monthly_limit = models.IntegerField(default=1000)
    monthly_usage = models.IntegerField(default=0)
    
    # Statistics
    total_requests = models.BigIntegerField(default=0)
    last_used_at = models.DateTimeField(null=True)
```

**Methods:**
```python
# دریافت API Key (با چک دسترسی)
api_key = settings.get_api_key()
# ✅ Super Admin: آزاد (personal یا shared)
# ✅ Normal Admin + use_shared_api=True: چک provider.allow_shared_for_normal_admins
# ✅ Normal Admin + use_shared_api=False: personal API

# افزایش شمارنده
settings.increment_usage()

# چک محدودیت
if settings.has_reached_limit():
    raise ValidationError("محدودیت ماهانه")

# ریست ماهانه
settings.reset_monthly_usage()
```

---

## 📈 **Performance Optimizations**

### 1️⃣ **Redis Cache Strategy**

```python
# AIProvider.get_active_providers()
cache_key = "ai_providers_active"
TIMEOUT = 300  # 5 دقیقه

# AIModel.get_models_by_provider('openai', 'chat')
cache_key = "ai_models_provider_openai_chat"
TIMEOUT = 300

# AIProvider.get_provider_by_slug('openai')
cache_key = "ai_provider_openai"
TIMEOUT = 300
```

**Cache Invalidation:**
- Auto-clear هنگام `save()` یا `delete()`
- `clear_cache()`: برای یک instance
- `clear_all_cache(pattern)`: برای pattern matching

---

### 2️⃣ **Database Indexes**

```python
# AIProvider indexes
models.Index(fields=['slug', 'is_active'])
models.Index(fields=['is_active', 'sort_order'])
models.Index(fields=['allow_shared_for_normal_admins'])

# AIModel indexes
models.Index(fields=['provider', 'is_active'])
models.Index(fields=['is_active', 'sort_order'])
models.Index(fields=['name'])

# AdminProviderSettings indexes
models.Index(fields=['admin', 'provider'])
models.Index(fields=['admin', 'is_active'])
models.Index(fields=['use_shared_api'])
```

---

### 3️⃣ **Query Optimization**

```python
# ✅ select_related برای ForeignKey
AIModel.objects.filter(is_active=True)
    .select_related('provider')
    .order_by('sort_order')

# ✅ only() برای فیلدهای مورد نیاز
AIProvider.objects.filter(is_active=True)
    .only('id', 'name', 'slug', 'display_name')

# ✅ Cache list() results
models_list = list(query)  # Execute once
cache.set(cache_key, models_list, timeout)
```

---

## 🛡️ **Security Features**

### 1️⃣ **Encryption (Fernet/AES-128)**

```python
# Auto-encrypt هنگام save
if api_key and not api_key.startswith('gAAAAAB'):
    api_key = encrypt_key(api_key)

# Decrypt on-demand
decrypted = decrypt_key(encrypted_key)
```

**امنیت:**
- ✅ Fernet (symmetric encryption)
- ✅ Key derived از `settings.SECRET_KEY`
- ✅ SHA-256 hashing
- ✅ Base64 encoding

---

### 2️⃣ **Access Control**

```python
def get_api_key(self):
    is_super = self.admin.is_superuser or self.admin.is_admin_full
    
    if self.use_shared_api:
        if not is_super:
            # Normal admin - چک permission
            if not self.provider.allow_shared_for_normal_admins:
                raise ValidationError("دسترسی ندارید")
        
        return self.provider.get_shared_api_key()
    else:
        return self.get_personal_api_key()
```

---

## 📦 **Installation & Setup**

### 1️⃣ **Migration**

```bash
cd Backend
python manage.py makemigrations ai
python manage.py migrate
```

---

### 2️⃣ **Populate داده‌های اولیه**

```bash
python manage.py shell < scripts/populate_ai_providers.py
```

**این script اضافه می‌کنه:**
- 7 Provider: OpenAI, Anthropic, Google, OpenRouter, DeepSeek, Groq, Hugging Face
- 20+ Model: GPT-4o, Claude 3.5, Gemini 2.5, DeepSeek R1, Llama 3.3, ...

---

## 📝 **نتیجه‌گیری**

### ✅ **مزایا:**

| ویژگی | قبل | بعد |
|-------|------|------|
| **اضافه Provider** | ❌ تغییر کد | ✅ از پنل |
| **تعداد Provider** | ❌ 5-7 | ✅ نامحدود |
| **تعداد Model** | ❌ محدود | ✅ 30+ |
| **Performance** | ⚠️ معمولی | ✅ Redis Cache |
| **Security** | ⚠️ متوسط | ✅ Fernet |
| **DRY Code** | ❌ تکرار | ✅ Mixins |
| **Deploy** | ❌ هر بار | ✅ یک بار |

---

### 👍 **چرا این راه‌حل بهتره:**

1️⃣ **No Code Changes**: Provider جدید اضافه کن بدون تغییر کد  
2️⃣ **No Migration**: فقط داده به دیتابیس اضافه میشه  
3️⃣ **DRY**: Mixins برای Encryption + Cache  
4️⃣ **Performance**: Redis Cache + DB Indexes  
5️⃣ **Security**: Fernet Encryption  
6️⃣ **Flexible**: JSONField برای capabilities + config  
7️⃣ **Scalable**: نامحدود Provider و Model  

---

## 🚀 **بعدی:**

1. ✅ **Models** → ساخته شد (با Mixins)
2. ✅ **Populate Script** → ساخته شد
3. ⚠️ **Serializers** → بعدی
4. ⚠️ **ViewSets** → بعدی
5. ⚠️ **Frontend** → بعدی

**می‌خوای Serializers و ViewSets رو بسازم؟** 🚀
