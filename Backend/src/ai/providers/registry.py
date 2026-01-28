from typing import Dict, Type, Optional, Any
import inspect
from .base import BaseProvider

class AIProviderRegistry:
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
        if not issubclass(provider_class, BaseProvider):
            raise ValueError(f"{provider_class.__name__} must inherit from BaseProvider")
        
        cls._providers[name] = provider_class
    
    @classmethod
    def get(cls, name: str) -> Optional[Type[BaseProvider]]:
        return cls._providers.get(name)
    
    @classmethod
    def get_registered_names(cls) -> list[str]:
        return list(cls._providers.keys())
    
    @classmethod
    def is_registered(cls, name: str) -> bool:
        return name in cls._providers
    
    @classmethod
    def create_instance(cls, name: str, api_key: str, config: Optional[Dict[str, Any]] = None) -> BaseProvider:
        provider_class = cls.get(name)
        if not provider_class:
            raise ValueError(f"Provider '{name}' not found. Registered providers: {', '.join(cls.get_registered_names())}")
        
        return provider_class(api_key=api_key, config=config or {})
    
    @classmethod
    def auto_discover(cls):
        try:
            from .gemini import GeminiProvider
            from .openai import OpenAIProvider
            from .huggingface import HuggingFaceProvider
            from .deepseek import DeepSeekProvider
            from .openrouter import OpenRouterProvider
            from .groq import GroqProvider
            
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
            pass
    
    @classmethod
    def get_all_providers(cls) -> Dict[str, Type[BaseProvider]]:
        return cls._providers.copy()
    
    @classmethod
    def clear(cls):
        cls._providers.clear()
        cls._initialized = False

def get_provider_instance(name: str, api_key: str, config: Optional[Dict[str, Any]] = None) -> BaseProvider:
    registry = AIProviderRegistry()
    return registry.create_instance(name, api_key, config)

