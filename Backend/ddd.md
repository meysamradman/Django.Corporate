بهترین راه‌حل‌ها برای Circular Import در Django
📌 1. استراتژی کلی (Priority Order)
برای رابطه‌های ForeignKey و ManyToMany با models از app های دیگر، از دستور "<app_label>.<model>" استفاده کنید به جای import کردن model Packtpub:
python# ✅ CORRECT - در models.py
class AIProvider(models.Model):
    # به جای: from src.ai.services import SomeModel
    related_service = models.ForeignKey('services.ServiceModel', ...)
📌 2. Local Imports (Lazy Imports) - چه موقع استفاده کنیم؟
95% مواقع باید همه importها در بالای فایل باشند. یک مورد که ممکن است بخواهید از local import استفاده کنید این است که برای جلوگیری از circular imports مجبور باشید این کار را انجام دهید Stack Overflow.
اگر نیاز دارید به یک model از app دیگر در یک متد دسترسی داشته باشید، آن model را داخل متد import کنید به جای سطح module Packtpub:
python# ✅ CORRECT - Local import در متد
class Category(models.Model):
    def get_ideas_without_this_category(self):
        from myproject.apps.ideas.models import Idea  # داخل متد
        return Idea.objects.exclude(category=self)
📌 3. استفاده از apps.get_model() - چه موقع؟
برای استفاده از model، آن را به این شکل import کنید: from django.apps import apps; ModelName = apps.get_model(app_label='app_name', model_name='ModelName') Stack Overflow
یک overhead کوچک وجود دارد، اما فقط یک بار Stack Overflow.
python# ✅ CORRECT - در سرویس‌ها
def some_service_method(self):
    from django.apps import apps
    AIProvider = apps.get_model('ai', 'AIProvider')
    # استفاده از AIProvider

⚡ Performance - نگرانی لازم نیست!
Import Performance:
نقطه‌ای که شما یک module را import می‌کنید انتظار نمی‌رود باعث penalty performance شود Stack Overflow.
هرچند interpreter پایتون بهینه شده تا یک module را چند بار import نکند، اجرای مکرر دستور import می‌تواند به طور جدی بر performance تأثیر بگذارد در برخی شرایط Stack OverflowStack Overflow.
Local Import در Loop:
python# ❌ BAD - Import در loop
def process_items():
    for i in range(100000):
        from module import function  # هر بار lookup می‌شود!
        function(i)

# ✅ GOOD - Import بیرون از loop
def process_items():
    from module import function  # فقط یک بار
    for i in range(100000):
        function(i)
```

---

## 🎯 **استانداردهای PEP 8**

Importها باید همیشه در بالای فایل نوشته شوند، بعد از هر module comment و docstring .

بیشتر پروژه‌ها importها را در بالا قرار می‌دهند. مهم این نیست که A یا B بهتر است، بلکه مهم این است که همه سعی کنیم به طور مداوم از یک روش استفاده کنیم .

---

## 💡 **راه‌حل پیشنهادی برای پروژه شما**

### ساختار پیشنهادی:
```
src/ai/
├── models/
│   ├── __init__.py          # فقط export models
│   └── ai_provider.py       # models اصلی
├── services/
│   ├── __init__.py          # فقط export services
│   └── service_files.py     # local imports برای models
└── utils/
    ├── __init__.py
    └── state_machine.py     # utility classes
در models/__init__.py:
python# ✅ Export models - استاندارد
from .ai_provider import AIProvider, AIModel, AdminProviderSettings

__all__ = ['AIProvider', 'AIModel', 'AdminProviderSettings']
در ai_provider.py:
python# ✅ Import utilities در بالا - استاندارد
from src.ai.utils.state_machine import ModelAccessState

class AIProvider(models.Model):
    # استفاده از ModelAccessState
    pass
در services/__init__.py:
python# ✅ Export services - استاندارد
from .image_generation_service import AIImageGenerationService

__all__ = ['AIImageGenerationService']
در image_generation_service.py:
python# ✅ Top-level imports برای چیزهای non-circular
from typing import Optional, Dict
from django.conf import settings

# ✅ Local import برای models (جلوگیری از circular)
class AIImageGenerationService:
    def __init__(self):
        # Local import فقط جایی که لازمه
        from src.ai.models import AIProvider, AdminProviderSettings
        self.AIProvider = AIProvider
        self.AdminProviderSettings = AdminProviderSettings
    
    def generate_image(self, ...):
        provider = self.AIProvider.objects.get(...)
        # ...

🔴 چرا Local Import در Services مشکلی ندارد؟

فقط یک بار اجرا می‌شود: در __init__ service
Circular Import را می‌شکند: اگر فقط در موارد خاصی نیاز به import یک module دارید، یکی از راه‌حل‌های بهتر برای circular imports چیزی به نام lazy import است Python Morsels
Performance خوب: Import وقتی service instantiate می‌شه، نه در هر request


✅ خلاصه Final Solution
python# models/ai_provider.py
from src.ai.utils.state_machine import ModelAccessState  # ✅ Top-level

class AIProvider(models.Model):
    state = ModelAccessState()

# services/image_generation_service.py  
class AIImageGenerationService:
    def __init__(self):
        from src.ai.models import AIProvider  # ✅ Local (فقط اینجا)
        self.provider_model = AIProvider
چرا این بهترینه؟

✅ استاندارد PEP 8: اکثر importها بالا هستند
✅ No circular import: با local import در service
✅ Performance عالی: فقط یک بار import می‌شه
✅ خوانا: dependencies واضح هستند
✅ Maintainable: ساختار منطقی