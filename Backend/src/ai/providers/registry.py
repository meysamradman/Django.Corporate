"""
AI Provider Registry - سیستم ثبت و مدیریت دینامیک Providerها

این ماژول یک سیستم Registry Pattern پیاده‌سازی می‌کند که:
- Providerها را به صورت خودکار شناسایی و ثبت می‌کند
- امکان ایجاد instance از providerها را فراهم می‌کند
- از Singleton Pattern استفاده می‌کند
"""

from typing import Dict, Type, Optional, Any
import inspect
from .base import BaseProvider


class AIProviderRegistry:
    """
    Registry برای مدیریت Providerهای AI
    
    این کلاس از Singleton Pattern استفاده می‌کند تا فقط یک instance
    در کل برنامه وجود داشته باشد.
    """
    
    _instance = None
    _providers: Dict[str, Type[BaseProvider]] = {}
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._initialized = True
            self.auto_discover()
    
    @classmethod
    def register(cls, name: str, provider_class: Type[BaseProvider]):
        """
        ثبت یک Provider در Registry
        
        Args:
            name: نام provider (مثل 'openai', 'gemini')
            provider_class: کلاس Provider که از BaseProvider ارث‌بری می‌کند
        """
        if not issubclass(provider_class, BaseProvider):
            raise ValueError(f"{provider_class.__name__} must inherit from BaseProvider")
        
        cls._providers[name] = provider_class
    
    @classmethod
    def get(cls, name: str) -> Optional[Type[BaseProvider]]:
        """
        دریافت کلاس Provider بر اساس نام
        
        Args:
            name: نام provider
            
        Returns:
            کلاس Provider یا None اگر یافت نشد
        """
        return cls._providers.get(name)
    
    @classmethod
    def get_registered_names(cls) -> list[str]:
        """
        دریافت لیست نام‌های Providerهای ثبت شده
        
        Returns:
            لیست نام‌های providerها
        """
        return list(cls._providers.keys())
    
    @classmethod
    def is_registered(cls, name: str) -> bool:
        """
        بررسی اینکه آیا Provider ثبت شده است یا نه
        
        Args:
            name: نام provider
            
        Returns:
            True اگر ثبت شده باشد، False در غیر این صورت
        """
        return name in cls._providers
    
    @classmethod
    def create_instance(cls, name: str, api_key: str, config: Optional[Dict[str, Any]] = None) -> BaseProvider:
        """
        ایجاد یک instance از Provider
        
        Args:
            name: نام provider
            api_key: API key برای provider
            config: تنظیمات اضافی (اختیاری)
            
        Returns:
            Instance از Provider
            
        Raises:
            ValueError: اگر provider یافت نشد
        """
        provider_class = cls.get(name)
        if not provider_class:
            raise ValueError(f"Provider '{name}' not found. Registered providers: {', '.join(cls.get_registered_names())}")
        
        return provider_class(api_key=api_key, config=config or {})
    
    @classmethod
    def auto_discover(cls):
        """
        شناسایی خودکار Providerها از ماژول providers
        
        این متد تمام کلاس‌هایی که از BaseProvider ارث‌بری می‌کنند
        و نامشان به 'Provider' ختم می‌شود را پیدا کرده و ثبت می‌کند.
        """
        # Import مستقیم از فایل‌ها برای جلوگیری از circular import
        # این import باید بعد از تعریف تمام providerها انجام شود
        try:
            # Import مستقیم از فایل‌ها (نه از __init__.py)
            from .gemini import GeminiProvider
            from .openai import OpenAIProvider
            from .huggingface import HuggingFaceProvider
            from .deepseek import DeepSeekProvider
            from .openrouter import OpenRouterProvider
            from .groq import GroqProvider
            
            # ثبت providerها
            providers_to_register = [
                ('gemini', GeminiProvider),
                ('openai', OpenAIProvider),
                ('huggingface', HuggingFaceProvider),
                ('deepseek', DeepSeekProvider),
                ('openrouter', OpenRouterProvider),
                ('groq', GroqProvider),
            ]
            
            for name, provider_class in providers_to_register:
                if provider_class and issubclass(provider_class, BaseProvider):
                    cls.register(name, provider_class)
        
        except ImportError as e:
            # اگر import خطا داد، لاگ می‌کنیم اما برنامه را متوقف نمی‌کنیم
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to auto-discover providers: {e}")
    
    @classmethod
    def get_all_providers(cls) -> Dict[str, Type[BaseProvider]]:
        """
        دریافت تمام Providerهای ثبت شده
        
        Returns:
            Dictionary از نام provider به کلاس آن
        """
        return cls._providers.copy()
    
    @classmethod
    def clear(cls):
        """
        پاک کردن تمام Providerهای ثبت شده
        (معمولاً فقط برای تست استفاده می‌شود)
        """
        cls._providers.clear()
        cls._initialized = False


def get_provider_instance(name: str, api_key: str, config: Optional[Dict[str, Any]] = None) -> BaseProvider:
    """
    Helper function برای ایجاد instance از Provider
    
    Args:
        name: نام provider
        api_key: API key
        config: تنظیمات اضافی
        
    Returns:
        Instance از Provider
    """
    registry = AIProviderRegistry()
    return registry.create_instance(name, api_key, config)


# Initialize registry lazily - فقط وقتی نیاز است
# این کار را در __init__.py انجام می‌دهیم تا از circular import جلوگیری کنیم

